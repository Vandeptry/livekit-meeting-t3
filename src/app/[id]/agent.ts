//src/app/[id]/agent.ts

let recognition: any | null = null;
export function startLocalAgent(onAgentSpeak: (text: string) => void) {
    // record
    const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn("SpeechRecognition not supported");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
        const text = e.results[e.results.length - 1][0].transcript.trim();
        console.log("User said:", text);

        // simple answer
        const normalize = (str: string) =>
            str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();

        const intentMatch = normalize(text);

        let reply = "I don't understand what you said yet.";

        if (intentMatch.includes("hello") || intentMatch.includes("hi")) reply = "Hello, I am the agent here.";
        else if (intentMatch.includes("who are you")) reply = "I am the virtual assistant in the meeting room.";
        else if (intentMatch.includes("how are you")) reply = "I'm doing very well, thank you.";
        else if (intentMatch.includes("alo") || intentMatch.includes("hello"))
            reply = "I hear you clearly.";

        onAgentSpeak(reply);
        speak(reply);

    };

    recognition.start();
    console.log("[AGENT] Ready to listen…");
    let reply = "Hello, How can I help you today?";
    onAgentSpeak(reply);
    speak(reply);
}

// text
export function speak(text: string) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    window.speechSynthesis.speak(utter);
}

export function stopLocalAgent() {
    try {
        if (recognition) recognition.stop();
    } catch (_) { }
    recognition = null;
    console.log("[AGENT] stopped");
}