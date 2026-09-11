import Foundation
import Speech
import AVFoundation

@MainActor
final class MacVoiceService: NSObject, ObservableObject {
    @Published var transcript = ""
    @Published var listening = false
    @Published var status = "語音待命"

    private let engine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-TW"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let speaker = AVSpeechSynthesizer()

    func speak(_ text: String) {
        guard !text.isEmpty else { return }
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-TW")
        utterance.rate = 0.48
        speaker.stopSpeaking(at: .immediate)
        speaker.speak(utterance)
    }

    func toggle() async {
        if listening {
            stop()
            return
        }

        let speech = await requestSpeechAuthorization()
        guard speech == .authorized else {
            status = "請在系統設定允許語音辨識"
            return
        }

        let mic = await requestMicrophoneAuthorization()
        guard mic else {
            status = "請在系統設定允許麥克風"
            return
        }

        do {
            transcript = ""
            request = SFSpeechAudioBufferRecognitionRequest()
            guard let request else { return }
            request.shouldReportPartialResults = true

            let input = engine.inputNode
            input.removeTap(onBus: 0)
            let format = input.outputFormat(forBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                request.append(buffer)
            }

            task = recognizer?.recognitionTask(with: request) { [weak self] result, error in
                Task { @MainActor in
                    guard let self else { return }
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                        if result.isFinal { self.stop() }
                    }
                    if error != nil { self.stop() }
                }
            }

            engine.prepare()
            try engine.start()
            listening = true
            status = "正在聆聽…"
        } catch {
            status = "語音啟動失敗：\(error.localizedDescription)"
            stop()
        }
    }

    func stop() {
        if engine.isRunning { engine.stop() }
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
        listening = false
        if status == "正在聆聽…" { status = "語音待命" }
    }

    private func requestSpeechAuthorization() async -> SFSpeechRecognizerAuthorizationStatus {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
    }

    private func requestMicrophoneAuthorization() async -> Bool {
        switch AVCaptureDevice.authorizationStatus(for: .audio) {
        case .authorized:
            return true
        case .notDetermined:
            return await AVCaptureDevice.requestAccess(for: .audio)
        default:
            return false
        }
    }
}
