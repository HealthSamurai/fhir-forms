export default function (
    _ctx: Context,
    _session: Session | null,
    opts: {
        age: number;
        duration: number;
        fever: boolean;
        breathless: boolean;
        chestPain: boolean;
    },
) {
    let score = 0;
    const factors: string[] = [];

    if (opts.age >= 65) {
        score += 2;
        factors.push("Age 65 or older (+2)");
    }
    if (opts.duration >= 7) {
        score += 1;
        factors.push("Symptoms for 7 days or longer (+1)");
    }
    if (opts.fever) {
        score += 1;
        factors.push("Fever reported (+1)");
    }
    if (opts.breathless) {
        score += 3;
        factors.push("Breathlessness reported (+3)");
    }
    if (opts.chestPain) {
        score += 4;
        factors.push("Chest pain reported (+4)");
    }

    if (score >= 6) {
        return {
            level: "urgent" as const,
            score,
            title: "Urgent assessment",
            message: "Escalate this submission for prompt clinician review.",
            factors,
        };
    }
    if (score >= 3) {
        return {
            level: "same-day" as const,
            score,
            title: "Same-day review",
            message: "Route this submission to a same-day clinical queue.",
            factors,
        };
    }
    return {
        level: "routine" as const,
        score,
        title: "Routine pathway",
        message: "Continue the standard intake and safety-net workflow.",
        factors,
    };
}
