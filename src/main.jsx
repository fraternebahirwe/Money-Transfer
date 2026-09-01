
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Globe2,
  History,
  Home,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap
} from "lucide-react";
import "./styles.css";

const COUNTRIES = [
  {
    code: "RW",
    name: "Rwanda",
    currency: "RWF",
    flag: "🇷🇼",
    dial: "+250"
  },
  {
    code: "UG",
    name: "Uganda",
    currency: "UGX",
    flag: "🇺🇬",
    dial: "+256"
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    flag: "🇰🇪",
    dial: "+254"
  },
  {
    code: "CD",
    name: "Congo",
    currency: "CDF",
    flag: "🇨🇩",
    dial: "+243"
  }
];

const CONTACTS = [
  {
    id: 1,
    name: "Aline",
    phone: "+250 788 123 456",
    country: "RW",
    initials: "AL"
  },
  {
    id: 2,
    name: "Brian",
    phone: "+256 702 345 678",
    country: "UG",
    initials: "BR"
  },
  {
    id: 3,
    name: "Kevin",
    phone: "+254 712 456 789",
    country: "KE",
    initials: "KV"
  },
  {
    id: 4,
    name: "Grace",
    phone: "+243 812 345 678",
    country: "CD",
    initials: "GR"
  }
];

const START_TX = [
  {
    id: "SF-92841",
    name: "Aline",
    type: "sent",
    amount: 45000,
    currency: "RWF",
    country: "RW",
    time: "Today, 18:42",
    status: "Completed"
  },
  {
    id: "SF-92812",
    name: "Brian",
    type: "received",
    amount: 120000,
    currency: "UGX",
    country: "UG",
    time: "Today, 14:18",
    status: "Completed"
  },
  {
    id: "SF-92766",
    name: "Kevin",
    type: "sent",
    amount: 3500,
    currency: "KES",
    country: "KE",
    time: "Yesterday, 20:05",
    status: "Completed"
  }
];

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const countryFor = (code) =>
  COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

function playClickSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;

    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";

    osc.frequency.setValueAtTime(560, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      760,
      ctx.currentTime + 0.045
    );

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.06,
      ctx.currentTime + 0.006
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + 0.07
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.075);
  } catch {
    // Browsers may block audio until the first user interaction.
  }
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      className={`nav-btn ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function App() {
  const [tab, setTab] = useState("home");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("send");
  const [pin, setPin] = useState("");
  const [transactions, setTransactions] = useState(START_TX);
  const [contactSearch, setContactSearch] = useState("");
  const [toast, setToast] = useState("");

  const inputRef = useRef(null);

  const popularContacts = useMemo(
    () =>
      CONTACTS.filter((c) =>
        c.name
          .toLowerCase()
          .includes(contactSearch.toLowerCase())
      ),
    [contactSearch]
  );

  useEffect(() => {
    const saved = localStorage.getItem("sendflow-transactions");

    if (saved) {
      setTransactions(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "sendflow-transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  const notify = (text) => {
    setToast(text);

    setTimeout(() => {
      setToast("");
    }, 2200);
  };

  const appendNumber = (n) => {
    playClickSound();

    setAmount((old) => {
      const next = `${old}${n}`;

      if (next.length > 9) {
        return old;
      }

      return next;
    });
  };

  const backspace = () => {
    playClickSound();
    setAmount((old) => old.slice(0, -1));
  };

  const selectRecipient = (contact) => {
    setRecipient(contact);
    setCountry(countryFor(contact.country));
    setPhone(
      contact.phone
        .replace(/\D/g, "")
        .slice(-9)
    );

    notify(`Recipient selected: ${contact.name}`);
  };

  const startTransfer = () => {
    if (!amount || Number(amount) <= 0) {
      notify("Enter an amount first");
      return;
    }

    if (!phone && !recipient) {
      notify(
        "Choose a recipient or enter a phone number"
      );
      return;
    }

    setStep("review");
  };

  const confirmTransfer = () => {
    if (pin.length !== 4) {
      notify("Enter your 4-digit PIN");
      return;
    }

    const tx = {
      id: `SF-${Math.floor(
        10000 + Math.random() * 89999
      )}`,
      name: recipient?.name || "New recipient",
      type: "sent",
      amount: Number(amount),
      currency: country.currency,
      country: country.code,
      time: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "Completed"
    };

    setTransactions((prev) => [tx, ...prev]);

    setStep("success");
    setPin("");
  };

  const resetTransfer = () => {
    setAmount("");
    setPhone("");
    setRecipient(null);
    setStep("send");
  };

  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      notify("Transaction ID copied");
    } catch {}
  };

  const renderHome = () => (
    <>
      <section className="hero-card">
        <div className="hero-glow" />

        <div className="hero-top">
          <div>
            <p className="eyebrow">
              <Sparkles size={14} />
              Smart transfers
            </p>

            <h1>Move money with confidence.</h1>

            <p className="hero-text">
              Simple cross-border transfers across Rwanda,
              Uganda, Kenya and Congo.
            </p>
          </div>

          <div className="shield">
            <ShieldCheck size={27} />
          </div>
        </div>

        <div className="balance-row">
          <div>
            <span>Available balance</span>
            <strong>2,450,000 RWF</strong>
          </div>

          <button
            className="mini-action"
            onClick={() => {
              setTab("send");
              setStep("send");
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </section>

      <section className="country-strip">
        <div>
          <p className="section-label">
            Transfer network
          </p>

          <h2>4 countries only</h2>
        </div>

        <Globe2 size={23} />

        <div className="country-pills">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              className="country-pill"
              onClick={() => {
                setCountry(c);
                setTab("send");
              }}
            >
              <span>{c.flag}</span>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="quick-grid">
        <button
          className="quick-card"
          onClick={() => {
            setTab("send");
            setStep("send");
          }}
        >
          <div className="quick-icon">
            <Send size={21} />
          </div>

          <div>
            <b>Send money</b>
            <span>Fast transfer</span>
          </div>

          <ArrowRight size={18} />
        </button>

        <button
          className="quick-card"
          onClick={() => setTab("contacts")}
        >
          <div className="quick-icon alt">
            <Users size={21} />
          </div>

          <div>
            <b>Contacts</b>
            <span>Saved recipients</span>
          </div>

          <ArrowRight size={18} />
        </button>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-label">
              Activity
            </p>

            <h2>Recent transfers</h2>
          </div>

          <button
            className="link-btn"
            onClick={() => setTab("history")}
          >
            View all
          </button>
        </div>

        <TransactionList
          transactions={transactions.slice(0, 3)}
        />
      </section>
    </>
  );

  const renderSend = () => {
    if (step === "review") {
      return (
        <section className="panel transfer-panel">
          <button
            className="back-btn"
            onClick={() => setStep("send")}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="review-head">
            <p className="eyebrow">
              <ShieldCheck size={14} />
              Secure review
            </p>

            <h2>Confirm your transfer</h2>

            <p>
              Check the details before sending.
            </p>
          </div>

          <div className="review-card">
            <div className="recipient-preview">
              <div className="avatar large">
                {recipient?.initials || "NR"}
              </div>

              <div>
                <strong>
                  {recipient?.name || "New recipient"}
                </strong>

                <span>
                  {country.dial}{" "}
                  {phone || recipient?.phone}
                </span>
              </div>
            </div>

            <div className="review-amount">
              <span>You're sending</span>

              <strong>
                {fmt(amount)} {country.currency}
              </strong>
            </div>

            <div className="review-line">
              <span>Destination</span>

              <b>
                {country.flag} {country.name}
              </b>
            </div>

            <div className="review-line">
              <span>Transfer fee</span>

              <b>
                0 {country.currency}
              </b>
            </div>

            <div className="review-line total">
              <span>Total</span>

              <b>
                {fmt(amount)} {country.currency}
              </b>
            </div>
          </div>

          <div className="pin-box">
            <div>
              <LockKeyhole size={18} />
              <b>Enter 4-digit PIN</b>
            </div>

            <div className="pin-dots">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={
                    i < pin.length
                      ? "filled"
                      : ""
                  }
                />
              ))}
            </div>

            <div className="pin-pad mini">
              {[
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                "",
                "0",
                "⌫"
              ].map((n, i) => (
                <button
                  key={i}
                  disabled={n === ""}
                  onClick={() => {
                    playClickSound();

                    if (n === "⌫") {
                      setPin((p) =>
                        p.slice(0, -1)
                      );
                    } else {
                      setPin((p) =>
                        p.length < 4
                          ? p + n
                          : p
                      );
                    }
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="primary-btn full"
            onClick={confirmTransfer}
          >
            <ShieldCheck size={18} />
            Confirm & Send
          </button>
        </section>
      );
    }

    if (step === "success") {
      return (
        <section className="success-panel">
          <div className="success-orbit">
            <Check size={45} />
          </div>

          <p className="eyebrow center">
            Transfer complete
          </p>

          <h2>Money sent successfully</h2>

          <p className="success-text">
            {fmt(amount)} {country.currency} was sent
            to {recipient?.name || "your recipient"}.
          </p>

          <div className="success-ticket">
            <span>Transaction ID</span>

            <div>
              <b>{transactions[0]?.id}</b>

              <button
                onClick={() =>
                  copyId(transactions[0]?.id)
                }
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <button
            className="primary-btn"
            onClick={() => {
              resetTransfer();
              setTab("home");
            }}
          >
            Done
          </button>

          <button
            className="ghost-btn"
            onClick={resetTransfer}
          >
            Send another
          </button>
        </section>
      );
    }

    return (
      <>
        <section className="panel transfer-panel">

          {/* MOBILE BACK BUTTON */}
          <button
            className="mobile-back-btn"
            onClick={() => {
              setTab("home");
              setStep("send");
            }}
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="panel-heading">
            <div>
              <p className="section-label">
                New transfer
              </p>

              <h2>Send money</h2>
            </div>

            <div className="live-chip">
              <span />
              Secure
            </div>
          </div>

          <label className="field-label">
            Country
          </label>

          <button
            className="country-select"
            onClick={() =>
              setShowCountries((v) => !v)
            }
          >
            <span className="country-main">
              <span className="flag-big">
                {country.flag}
              </span>

              <span>
                <b>{country.name}</b>

                <small>
                  {country.currency} ·{" "}
                  {country.dial}
                </small>
              </span>
            </span>

            <ChevronDown size={19} />
          </button>

          {showCountries && (
            <div className="country-menu">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCountry(c);
                    setShowCountries(false);
                  }}
                >
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                  <small>{c.currency}</small>
                </button>
              ))}
            </div>
          )}

          <label className="field-label">
            Recipient
          </label>

          <div className="input-wrap">
            <Phone size={18} />

            <input
              ref={inputRef}
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 12)
                )
              }
              placeholder="Enter phone number"
            />
          </div>

          <div className="or-row">
            <span>or choose a contact</span>
          </div>

          <div className="horizontal-contacts">
            {CONTACTS.map((c) => (
              <button
                key={c.id}
                className={`contact-mini ${
                  recipient?.id === c.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectRecipient(c)
                }
              >
                <div className="avatar">
                  {c.initials}
                </div>

                <span>{c.name}</span>
              </button>
            ))}
          </div>

          <label className="field-label amount-label">
            Amount
          </label>

          <div className="amount-display">
            <span>{country.currency}</span>

            <strong>
              {amount ? fmt(amount) : "0"}
            </strong>
          </div>

          <div className="keypad">
            {[
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              ".",
              0,
              "⌫"
            ].map((n, i) => (
              <button
                key={i}
                disabled={n === "."}
                onClick={() =>
                  n === "⌫"
                    ? backspace()
                    : appendNumber(n)
                }
              >
                {n}
              </button>
            ))}
          </div>

          <button
            className="primary-btn full"
            onClick={startTransfer}
          >
            <Send size={18} />
            Review transfer
            <ArrowRight size={18} />
          </button>

          <p className="security-note">
            <ShieldCheck size={15} />
            Demo mode · no real money is moved
          </p>
        </section>
      </>
    );
  };

  const renderContacts = () => (
    <section className="panel">

      {/* MOBILE BACK BUTTON */}
      <button
        className="mobile-back-btn"
        onClick={() => setTab("home")}
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="panel-heading">
        <div>
          <p className="section-label">
            People
          </p>

          <h2>Your contacts</h2>
        </div>

        <button className="icon-btn">
          <Plus size={18} />
        </button>
      </div>

      <div className="search-box">
        <Search size={17} />

        <input
          placeholder="Search contacts"
          value={contactSearch}
          onChange={(e) =>
            setContactSearch(e.target.value)
          }
        />
      </div>

      <div className="contacts-list">
        {popularContacts.map((c) => (
          <button
            key={c.id}
            className="contact-row"
            onClick={() => {
              selectRecipient(c);
              setTab("send");
            }}
          >
            <div className="avatar">
              {c.initials}
            </div>

            <div className="contact-copy">
              <b>{c.name}</b>

              <span>
                {countryFor(c.country).flag}{" "}
                {c.phone}
              </span>
            </div>

            <ArrowRight size={17} />
          </button>
        ))}
      </div>
    </section>
  );

  const renderHistory = () => (
    <section className="panel">

      {/* MOBILE BACK BUTTON */}
      <button
        className="mobile-back-btn"
        onClick={() => setTab("home")}
      >
        <ArrowLeft size={17} />
        Back
      </button>

      <div className="panel-heading">
        <div>
          <p className="section-label">
            Activity
          </p>

          <h2>Transaction history</h2>
        </div>

        <History size={21} />
      </div>

      <TransactionList
        transactions={transactions}
        detailed
      />
    </section>
  );

  return (
    <div className="app-shell">

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Zap size={20} />
          </div>

          <div>
            <b>SendFlow</b>
            <span>Money transfer</span>
          </div>
        </div>

        <nav>
          <NavButton
            icon={<Home size={18} />}
            label="Overview"
            active={tab === "home"}
            onClick={() => setTab("home")}
          />

          <NavButton
            icon={<Send size={18} />}
            label="Send money"
            active={tab === "send"}
            onClick={() => {
              setTab("send");
              setStep("send");
            }}
          />

          <NavButton
            icon={<Users size={18} />}
            label="Contacts"
            active={tab === "contacts"}
            onClick={() => setTab("contacts")}
          />

          <NavButton
            icon={<History size={18} />}
            label="History"
            active={tab === "history"}
            onClick={() => setTab("history")}
          />
        </nav>

        <div className="sidebar-bottom">
          <div className="network-card">
            <Globe2 size={18} />

            <div>
              <b>Regional network</b>
              <span>RW · UG · KE · CD</span>
            </div>
          </div>

          <div className="profile-mini">
            <div className="avatar">
              FB
            </div>

            <div>
              <b>Fraterne</b>
              <span>Personal wallet</span>
            </div>

            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">

          <button className="mobile-menu">
            <Menu size={21} />
          </button>

          <div>
            <p className="welcome">
              Your money, your control.
            </p>
          </div>

          <div className="top-actions">
            <div className="secure-badge">
              <ShieldCheck size={15} />
              Protected
            </div>

            <div className="avatar">
              FB
            </div>
          </div>
        </header>

        <div className="content">
          {tab === "home" && renderHome()}

          {tab === "send" && renderSend()}

          {tab === "contacts" &&
            renderContacts()}

          {tab === "history" &&
            renderHistory()}
        </div>
      </main>

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function TransactionList({
  transactions,
  detailed = false
}) {
  return (
    <div className="tx-list">
      {transactions.map((tx) => (
        <div
          className="tx-row"
          key={tx.id}
        >
          <div
            className={`tx-icon ${
              tx.type === "sent"
                ? "sent"
                : "received"
            }`}
          >
            {tx.type === "sent" ? (
              <ArrowUpRight size={18} />
            ) : (
              <ArrowDownLeft size={18} />
            )}
          </div>

          <div className="tx-copy">
            <b>{tx.name}</b>

            <span>
              {countryFor(tx.country).flag}{" "}
              {tx.time}
              {detailed
                ? ` · ${tx.id}`
                : ""}
            </span>
          </div>

          <div className="tx-value">
            <b
              className={
                tx.type === "sent"
                  ? "minus"
                  : "plus"
              }
            >
              {tx.type === "sent"
                ? "-"
                : "+"}
              {fmt(tx.amount)}{" "}
              {tx.currency}
            </b>

            <span>{tx.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
