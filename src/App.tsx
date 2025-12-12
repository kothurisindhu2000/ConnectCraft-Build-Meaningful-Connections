import React, { useEffect, useState, type JSX } from "react";
import "./App.css";

/* ----------------------
   Types
   ---------------------- */
type MessageType =
  | "cold_same_field"
  | "referral_request"
  | "thank_you"
  | "follow_up";

interface FormState {
  messageType: MessageType;
  recipientName: string;
  theirRole: string;
  company: string;
  yourBackground: string;
  goal: string; // extra detail about ask (optional)
  context: string;
  jobLink: string; // job URL
  PortfolioLink: string; // PortfolioLink
  recipientLevel: string; // job level for greeting
  senderName: string; // sender name
}

/* ----------------------
   Helpers
   ---------------------- */
const LS_MESSAGES = "lmgen_saved_messages_v1";
const LS_THEME = "lmgen_theme_v1";

function formatName(name: string) {
  if (!name) return "";
  return (
    name.trim().charAt(0).toUpperCase() +
    name.trim().slice(1).toLowerCase()
  );
}

// remove trailing punctuation to avoid ".." or "Capgemini. and"
function clean(s: string) {
  return (s || "").trim().replace(/[.!?]+$/, "");
}

// safety net only – used for the short mode
function enforceLinkedInLength(message: string, maxLen: number): string {
  if (message.length > maxLen) {
    return message.slice(0, maxLen - 3).trim() + "...";
  }
  return message;
}

/* Greeting based on job level */
function getGreeting(level: string): string {
  const v = (level || "").toLowerCase();

  if (v.includes("director") || v.includes("vp") || v.includes("chief")) {
    return "Dear";
  }
  if (v.includes("manager") || v.includes("lead") || v.includes("head")) {
    return "Hello";
  }

  // entry, mid, senior, principal, staff → all just "Hi"
  return "Hi";
}

/* Light normalization only – no risky grammar changes */
function rewriteInputs(form: FormState, toneIndex: number): FormState {
  const safe = (s: string) => (s || "").trim();
  const normalize = (text: string) => {
    if (!text) return text;
    let out = text.replace(/\bpls\b/gi, "please");
    out = out.replace(/\bplz\b/gi, "please");
    out = out.replace(/\b&\b/g, "and");
    out = out.replace(/\s{2,}/g, " ");
    return out.trim();
  };

  return {
    ...form,
    recipientName: formatName(safe(form.recipientName)),
    theirRole: normalize(safe(form.theirRole)),
    company: normalize(safe(form.company)),
    yourBackground: normalize(safe(form.yourBackground)),
    goal: normalize(safe(form.goal)),
    context: normalize(safe(form.context)),
    senderName: formatName(safe(form.senderName)),
  };
}

/* ----------------------
   Message generation
   ---------------------- */
function generateMessage(
  form: FormState,
  toneIndex: number,
  charLimit: number
): string {
  const {
    messageType,
    recipientName,
    theirRole,
    company,
    yourBackground,
    goal,
    context,
    jobLink,
    PortfolioLink,
    recipientLevel,
    senderName,
  } = form;

  if (!recipientName || !company) {
    return "Fill at least Name and Company to see a preview.";
  }

  const name = formatName(recipientName);
  const ctx = context ? context.trim() : "";

  const companyClean = clean(company);
  const roleClean = clean(theirRole);
  const backgroundClean = clean(yourBackground);
  const goalClean = clean(goal);

  const greeting = getGreeting(recipientLevel);

  const jobSentence = jobLink
    ? ` I’m particularly interested in this role: ${jobLink}.`
    : "";

  const contextSentence = ctx ? ` ${ctx}` : "";

  // without goalType dropdown, just use goal text if present
  const goalSentence = goalClean || "";

  // fallback if senderName blank
  const signatureName = senderName || "Your Name";

  const portfolioLine =
  PortfolioLink && PortfolioLink.trim().length > 0
    ? `\n${PortfolioLink.trim()}`
    : "";


  let base = "";

  /* ----------------------
   Short true 200-character versions
   ---------------------- */
if (charLimit === 200) {
  switch (messageType) {
    case "cold_same_field":
      if (toneIndex === 0) {
        base = `${greeting} ${name} 👋 I’m ${backgroundClean} exploring roles at ${companyClean}. Impressed by your work as ${roleClean} and would love to connect.${contextSentence}`;
      } else if (toneIndex === 1) {
        base = `${greeting} ${name}, I’m ${backgroundClean} interested in ${companyClean}. Your experience as ${roleClean} stood out—would appreciate connecting.${contextSentence}`;
      } else {
        base = `${greeting} ${name}, I’m ${backgroundClean} exploring roles at ${companyClean}. Could we connect? I’d value quick insight on your path as ${roleClean}.${contextSentence}`;
      }
      return enforceLinkedInLength(base, charLimit);

    case "referral_request":
      if (toneIndex === 0) {
        base = `${greeting} ${name} 👋 I’m ${backgroundClean} exploring roles at ${companyClean} in ${goalClean || "your area"}. If my profile fits, I’d appreciate a quick chat or referral.${contextSentence}`;
      } else if (toneIndex === 1) {
        base = `${greeting} ${name}, I’m ${backgroundClean} looking at roles at ${companyClean}. If my experience aligns with ${goalClean || "your team"}, could we connect or discuss a referral?${contextSentence}`;
      } else {
        base = `${greeting} ${name}, I’m ${backgroundClean} exploring ${goalClean || "open"} roles at ${companyClean}. If it seems relevant, could you consider a referral or point me to the right person?${contextSentence}`;
      }
      return enforceLinkedInLength(base, charLimit);

    case "thank_you":
      if (toneIndex === 0) {
        base = `${greeting} ${name} 👋 Thank you for speaking with me about ${companyClean} and your role as ${roleClean}. I truly appreciated your insight.${contextSentence}`;
      } else if (toneIndex === 1) {
        base = `${greeting} ${name}, thank you for your time discussing about ${companyClean} and your role as ${roleClean}. Your insight was very helpful.${contextSentence}`;
      } else {
        base = `${greeting} ${name}, thank you for speaking with me about ${companyClean} and your work as ${roleClean}. I appreciated the helpful guidance.${contextSentence}`;
      }
      return enforceLinkedInLength(base, charLimit);

    case "follow_up":
      if (toneIndex === 0) {
        base = `${greeting} ${name} 👋 Following up on our chat about ${companyClean}. I’m still very interested in ${goalClean || "your team"} and would appreciate any update.${contextSentence}`;
      } else if (toneIndex === 1) {
        base = `${greeting} ${name}, following up on our conversation about ${companyClean}. I remain interested in ${goalClean || "your team"} and welcome any update.${contextSentence}`;
      } else {
        base = `${greeting} ${name}, just checking in on our discussion about ${goalClean || "roles"} at ${companyClean}. Still interested and would appreciate an update.${contextSentence}`;
      }
      return enforceLinkedInLength(base, charLimit);
  }
}

  /* ----------------------
     Long 500-character versions
   ---------------------- */
switch (messageType) {
  case "cold_same_field":
    if (toneIndex === 0) {
      base =
        `${greeting} ${name} 👋\n\n` +
        `I hope you’re doing well. I came across your profile while exploring opportunities at ${companyClean} and was impressed by your work as ${roleClean}. ` +
        `I’m ${backgroundClean}, and I’m particularly interested in roles that overlap with your team${jobSentence}.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `If you’re open to it, I’d love to connect and hear briefly about your experience at ${companyClean} and any suggestions you might have for someone with my background.\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else if (toneIndex === 1) {
      base =
        `${greeting} ${name},\n\n` +
        `I hope you are doing well. I recently came across your profile while researching opportunities at ${companyClean} and was impressed by your experience as ${roleClean}. ` +
        `I’m ${backgroundClean}, and the work your team is doing closely aligns with my skills and interests${jobSentence}.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `If you are open to a brief conversation, I’d appreciate any insight you can share about your team and what you look for in strong candidates.\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else {
      base =
        `${greeting} ${name},\n\n` +
        `I’m ${backgroundClean}, exploring opportunities at ${companyClean}${jobSentence}.${contextSentence} ` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `Your experience as ${roleClean} is highly relevant to the path I’m aiming for. If you’re open to it, I’d be grateful for a quick connection and any brief guidance you can share.\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    }
    break;

  case "referral_request":
    if (toneIndex === 0) {
      base =
        `${greeting} ${name} 👋\n\n` +
        `Hope you’re doing well. I’m ${backgroundClean}, and I’m very interested in opportunities at ${companyClean}, especially roles related to ${goalClean || "your team"}${jobSentence}.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `If my background seems like a reasonable fit, I’d be grateful if you would consider a referral or a brief chat about how best to position myself for these roles.\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else if (toneIndex === 1) {
      const jobLine =
        jobLink && jobLink.trim().length > 0
          ? `I came across this position, which aligns closely with my experience: ${jobLink}.\n\n`
          : `I came across a position that aligns closely with my experience.\n\n`;

      base =
        `${greeting} ${name},\n\n` +
        `I hope you’re doing well. My name is ${signatureName}, and I’m currently exploring roles at ${companyClean}, particularly in your area of work.${contextSentence}\n\n` +
        jobLine +
        `If, after a quick look at my background, you feel I could be a good fit, would you be open to a brief conversation or referring me to the appropriate hiring contact?\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else {
      base =
        `${greeting} ${name},\n\n` +
        `I’m ${backgroundClean}, and I’m interested in ${goalClean || "relevant"} roles at ${companyClean}${jobSentence}.${contextSentence} ` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `If my profile appears to align with what your team needs, would you consider a referral or pointing me to the best person to contact?\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    }
    break;

  case "thank_you":
    if (toneIndex === 0) {
      base =
        `${greeting} ${name} 👋\n\n` +
        `Thank you again for taking the time to speak with me about ${companyClean} and your role as ${roleClean}. ` +
        `I really enjoyed our conversation—especially what you shared about ${goalClean || "your recent projects"}—and it made me even more excited about the work your team is doing.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `Thank you again for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else {
      base =
        `${greeting} ${name},\n\n` +
        `Thank you for speaking with me about ${companyClean} and your work as ${roleClean}. ` +
        `I found your insight on ${goalClean || "the role and team"} very helpful, and it gave me a clearer picture of the position.${contextSentence} ` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `Thank you again for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    }
    break;

  case "follow_up":
    if (toneIndex === 0) {
      base =
        `${greeting} ${name} 👋\n\n` +
        `Hope you’re doing well. I wanted to follow up on our recent conversation about opportunities at ${companyClean}${jobSentence}. ` +
        `I remain very interested in ${goalClean || "your team"} and would be glad to share any additional information or materials that might be helpful.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else if (toneIndex === 1) {
      base =
        `${greeting} ${name},\n\n` +
        `I hope you are doing well. I wanted to follow up regarding our recent discussion about opportunities at ${companyClean}${jobSentence}. ` +
        `I remain very interested in ${goalClean || "your team"} and would be happy to provide any further information that might support your decision-making.${contextSentence}\n\n` +
        `${goalSentence ? goalSentence + " " : ""}` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    } else {
      base =
        `${greeting} ${name},\n\n` +
        `I’m following up on our conversation about ${goalClean || "opportunities"} at ${companyClean}${jobSentence}. ` +
        `${contextSentence}${goalSentence ? " " + goalSentence : ""} ` +
        `I remain very interested and would appreciate any update or suggested next steps when you have a moment.\n\n` +
        `Thank you for your time and consideration.\n\n` +
        `Warm regards,\n${signatureName}${portfolioLine}`;
    }
    break;
}


  // no truncation in long mode
  return base;
}

/* ----------------------
   Component
   ---------------------- */
export default function App(): JSX.Element {
  const [form, setForm] = useState<FormState>({
    messageType: "cold_same_field",
    recipientName: "",
    theirRole: "",
    company: "",
    yourBackground: "",
    goal: "",
    context: "",
    jobLink: "",
    PortfolioLink: "",
    recipientLevel: "mid",
    senderName: "",
  });

  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => {
      return (localStorage.getItem(LS_THEME) as "light" | "dark") || "light";
    }
  );
  const [toneIndex, setToneIndex] = useState<number>(1);
  const [charLimit, setCharLimit] = useState<200 | 500>(500);

  const [savedMessages, setSavedMessages] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LS_MESSAGES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const rewritten = rewriteInputs(form, toneIndex);
  const preview = generateMessage(rewritten, toneIndex, charLimit);

  useEffect(() => {
    localStorage.setItem(LS_THEME, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LS_MESSAGES, JSON.stringify(savedMessages));
  }, [savedMessages]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!preview || preview.startsWith("Fill at least")) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveMessage = () => {
    if (!preview || preview.startsWith("Fill at least")) return;
    setSavedMessages((s) => [preview, ...s]);
  };

  const handleExport = (format: "txt" | "md") => {
    if (!preview || preview.startsWith("Fill at least")) return;
    const blob = new Blob([preview], { type: "text/plain;charset=utf-8" });
    const filename = `message-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.${format}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const deleteSavedMessage = (index: number) => {
    setSavedMessages((s) => s.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSavedMessages([]);
    localStorage.removeItem(LS_MESSAGES);
  };

  const clearInputs = () => {
    
    setForm({
      messageType: "cold_same_field",
      recipientName: "",
      theirRole: "",
      company: "",
      yourBackground: "",
      goal: "",
      context: "",
      jobLink: "",
      PortfolioLink: "",
      recipientLevel: "mid",
      senderName: "",
    });
    setCopied(false);
  };

  const openGithub = () => {
    window.open("https://github.com/kothurisindhu2000", "_blank");
  };

  const openPortfolio = () => {
  window.open("https://kothurisindhu2000.github.io/Portfolio-Sindhu/", "_blank");
};


  return (
    <div className="outer">
      <div className="app">
        {/* Top bar */}
        <header className="topbar">
          <div className="brand">
            <div className="brand-text">
              <div className="title">ConnectCraft</div>
              <div className="tagline">
                Build meaningful connections with personalized messages.
              </div>
            </div>
          </div>

          <div className="controls">
            <div className="control-row">
              <span className="small">Theme</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={() =>
                    setTheme(theme === "light" ? "dark" : "light")
                  }
                />
                <span className="slider" />
              </label>
            </div>

           <button className="ghost small" onClick={openGithub}>
            GitHub
            </button>
            <button className="ghost small" onClick={openPortfolio}>
           Portfolio
</button>

          </div>
        </header>

        {/* Main grid: Inputs + Preview */}
        <div className="main-grid">
          {/* Left panel: Inputs */}
          <section className="panel">
            <h2>Inputs</h2>

            <label>
              Message type
              <select
                name="messageType"
                value={form.messageType}
                onChange={handleChange}
              >
                <option value="cold_same_field">
                  Cold message (same field)
                </option>
                <option value="referral_request">Referral request</option>
                <option value="thank_you">Thank-you message</option>
                <option value="follow_up">Follow-up message</option>
              </select>
            </label>

            <label>
              Person’s name
              <input
                name="recipientName"
                value={form.recipientName}
                onChange={handleChange}
                placeholder="e.g., sindhu"
              />
            </label>

            <label>
              Their job title
              <input
                name="theirRole"
                value={form.theirRole}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
              />
            </label>

            <label>
              Recipient job level
              <select
                name="recipientLevel"
                value={form.recipientLevel}
                onChange={handleChange}
              >
                <option value="entry">Entry/ Mid level / Junior</option>
                <option value="senior">Senior / Principal / Staff</option>
                <option value="manager">Manager / Lead / Head</option>
                <option value="director">Director / VP / C-level</option>
              </select>
            </label>

            <label>
              Company name
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g., Amazon"
              />
            </label>

            <label>
              Your name
              <input
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                placeholder="e.g., Sindhu"
              />
            </label>

            <label>
              Your background (short)
              <input
                name="yourBackground"
                value={form.yourBackground}
                onChange={handleChange}
                placeholder="e.g., Data Analyst with experience in SQL and Python"
              />
            </label>

            <label>
              Job link (optional)
              <input
                name="jobLink"
                value={form.jobLink}
                onChange={handleChange}
                placeholder="Paste LinkedIn or careers job URL"
              />
            </label>

            <label>
              Portfolio link (optional)
              <input
                name="PortfolioLink"
                value={form.PortfolioLink}
                onChange={handleChange}
                placeholder="Paste Portfolio link"
              />
            </label>

            <div style={{ marginTop: 10, textAlign: "right" }}>
              <button className="small secondary" onClick={clearInputs}>
                Clear inputs
              </button>
            </div>
          </section>

          {/* Right panel: Preview + saved messages */}
          <section className="panel">
            <div className="preview-header">
              <h2>Preview</h2>
              <div className="preview-controls">
                <button className="small" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  className="small secondary"
                  onClick={handleSaveMessage}
                >
                  Save
                </button>
                <button
                  className="small secondary"
                  onClick={() => handleExport("md")}
                >
                  Export .md
                </button>
                <button
                  className="small secondary"
                  onClick={() => handleExport("txt")}
                >
                  Export .txt
                </button>
              </div>
            </div>

            {/* Character limit box under preview header */}
            <div className="tone" style={{ marginTop: 5 }}>
              <span className="small">Character limit</span>
              <select
                value={charLimit}
                onChange={(e) =>
                  setCharLimit(Number(e.target.value) as 200 | 500)
                }
              >
                <option value={200}>200 characters (short)</option>
                <option value={500}>500 characters (long)</option>
              </select>
            </div>

            {/* Tone slider + labels */}
            <div className="tone">
              <span className="small">Personality</span>
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={toneIndex}
                onChange={(e) => setToneIndex(Number(e.target.value))}
              />
              <div className="tone-labels">
                <span className={toneIndex === 0 ? "active" : ""}>
                  Friendly
                </span>
                <span className={toneIndex === 1 ? "active" : ""}>
                  Professional
                </span>
                <span className={toneIndex === 2 ? "active" : ""}>
                  Short &amp; to the point
                </span>
              </div>
            </div>

            <textarea
              className="preview"
              style={{ marginTop: 10 }}
              readOnly
              value={preview}
              placeholder="Your LinkedIn message will appear here..."
            />

            <details className="saved-list">
              <summary>Saved messages ({savedMessages.length})</summary>
              <div className="list">
                {savedMessages.map((msg, i) => (
                  <div key={i} className="item">
                    <p className="message-snippet">{msg}</p>
                    <div className="preview-controls">
                      <button
                        className="small secondary"
                        onClick={() => navigator.clipboard.writeText(msg)}
                      >
                        Copy
                      </button>
                      <button
                        className="small danger"
                        onClick={() => deleteSavedMessage(i)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <div className="danger-zone">
              <button className="danger small" onClick={clearAll}>
                Clear all saved data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
