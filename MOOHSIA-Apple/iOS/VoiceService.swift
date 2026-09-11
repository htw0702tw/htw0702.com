import Foundation
import Speech
import AVFoundation

@MainActor
final class VoiceService: NSObject, ObservableObject {
    @Published var transcript = ""
    @Published var listening = false
    private let engine = AVAudioEngine()
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-TW"))
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let speaker = AVSpeechSynthesizer()

    func speak(_ text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "zh-TW")
        speaker.speak(utterance)
    }

    private func authorizationStatus() async -> SFSpeechRecognizerAuthorizationStatus {
        await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
    }

    func toggle() async {
        if listening { stop(); return }
        let auth = await authorizationStatus()
        guard auth == .authorized else { return }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)
            request = SFSpeechAudioBufferRecognitionRequest()
            guard let request else { return }
            let input = engine.inputNode
            input.removeTap(onBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in
                request.append(buffer)
            }
            task = recognizer?.recognitionTask(with: request) { [weak self] result, _ in
                Task { @MainActor in
                    guard let self else { return }
                    if let value = result?.bestTranscription.formattedString { self.transcript = value }
                }
            }
            engine.prepare()
            try engine.start()
            listening = true
        } catch { stop() }
    }

    func stop() {
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
        listening = false
    }
}
