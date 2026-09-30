import { useState } from "react";
import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { sendOtp, verifyOtp } from "../../lib/api/auth";
import { useAuthStore } from "../../stores/auth-store";
import "./admin-login.css";

type Language = "en" | "es";
type Step = "email" | "code";

const copy = {
  en: {
    portal: "Admin portal",
    lang: "Español",
    eyebrow: "ADMIN ACCESS",
    title: "A little gratitude goes a long way.",
    intro: "Sign in to the TipPal admin portal with a secure code sent to your email.",
    passwordless: "Passwordless access",
    emailLabel: "Work email",
    emailPlaceholder: "you@company.com",
    send: "Send secure code",
    sending: "Sending code…",
    codeTitle: "Check your email",
    codeIntro: "Enter the six-digit code we sent to",
    codeLabel: "Verification code",
    verify: "Verify and continue",
    verifying: "Verifying…",
    resend: "Send a new code",
    resending: "Sending…",
    changeEmail: "Use a different email",
    successTitle: "Email verified",
    successText: "Your code was accepted. The server must confirm administrator access before the admin panel can open.",
    startOver: "Start over",
    footer: "Secure access for administrators",
    uncertain: "We could not confirm whether the request finished. The server may have sent your code already. Check your inbox and enter it here before requesting another.",
    errors: {
      email: "Enter a valid email address.",
      send: "We could not send the code. Please try again.",
      offline: "We could not connect to TipPal. Check your connection and try again.",
      rate: "Too many attempts. Wait a moment before trying again.",
      code: "Enter the six-digit code from your email.",
      invalid: "That code is incorrect or has expired. Check it and try again.",
      locked: "This account is temporarily locked. Contact your administrator.",
      verify: "We could not verify the code. Please try again.",
    },
  },
  es: {
    portal: "Portal de administración",
    lang: "English",
    eyebrow: "ACCESO DE ADMINISTRADOR",
    title: "Un poco de gratitud hace mucho.",
    intro: "Entra al portal de administración de TipPal con un código seguro enviado a tu correo.",
    passwordless: "Acceso sin contraseña",
    emailLabel: "Correo de trabajo",
    emailPlaceholder: "tu@empresa.com",
    send: "Enviar código seguro",
    sending: "Enviando código…",
    codeTitle: "Revisa tu correo",
    codeIntro: "Escribe el código de seis dígitos que enviamos a",
    codeLabel: "Código de verificación",
    verify: "Verificar y continuar",
    verifying: "Verificando…",
    resend: "Enviar otro código",
    resending: "Enviando…",
    changeEmail: "Usar otro correo",
    successTitle: "Correo verificado",
    successText: "Aceptamos tu código. El servidor debe confirmar los permisos de administrador antes de abrir el panel.",
    startOver: "Volver a empezar",
    footer: "Acceso seguro para administradores",
    uncertain: "No pudimos confirmar si la solicitud terminó. Es posible que el servidor ya haya enviado el código. Revisa tu correo y escríbelo aquí antes de solicitar otro.",
    errors: {
      email: "Escribe un correo válido.",
      send: "No pudimos enviar el código. Inténtalo de nuevo.",
      offline: "No pudimos conectar con TipPal. Revisa tu conexión e inténtalo de nuevo.",
      rate: "Hubo demasiados intentos. Espera un momento antes de volver a intentar.",
      code: "Escribe el código de seis dígitos que recibiste por correo.",
      invalid: "El código es incorrecto o venció. Revísalo e inténtalo de nuevo.",
      locked: "Esta cuenta está bloqueada temporalmente. Contacta al administrador.",
      verify: "No pudimos verificar el código. Inténtalo de nuevo.",
    },
  },
} satisfies Record<Language, Record<string, any>>;

function apiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

function AdminLoginForm({ language }: { language: Language }) {
  const t = copy[language];
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [deliveryUncertain, setDeliveryUncertain] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sendError, setSendError] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const setSession = useAuthStore((state) => state.setSession);

  const sendMutation = useMutation({
    mutationFn: sendOtp,
    retry: false,
    onSuccess: () => {
      setSendError("");
      setDeliveryUncertain(false);
      setStep("code");
    },
    onError: (error) => {
      const status = apiStatus(error);
      if (!status || status >= 500) {
        setDeliveryUncertain(true);
        setStep("code");
        setSendError("");
      } else {
        setSendError(status === 429 ? t.errors.rate : t.errors.send);
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(email.trim().toLowerCase(), code),
    retry: false,
    onSuccess: ({ accessToken, user }) => {
      setSession(accessToken, user);
      setVerified(true);
      setVerifyError("");
    },
    onError: (error) => {
      const status = apiStatus(error);
      if (status === 401) setVerifyError(t.errors.invalid);
      else if (status === 423) setVerifyError(t.errors.locked);
      else if (status === 429) setVerifyError(t.errors.rate);
      else if (!status) setVerifyError(t.errors.offline);
      else setVerifyError(t.errors.verify);
    },
  });

  function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSendError(t.errors.email);
      return;
    }
    setEmail(normalizedEmail);
    setSendError("");
    sendMutation.mutate(normalizedEmail);
  }

  function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setVerifyError(t.errors.code);
      return;
    }
    setVerifyError("");
    verifyMutation.mutate();
  }

  function startOver() {
    setStep("email");
    setCode("");
    setVerified(false);
    setDeliveryUncertain(false);
    setSendError("");
    setVerifyError("");
  }

  return (
    <main className="admin-login">
      <div className="admin-login__topbar">
        <a className="admin-login__brand" href={language === "es" ? "/es/" : "/"} aria-label="TipPal home">
          <img src="/assets/logo.png" alt="TipPal" />
        </a>
        <div className="admin-login__top-actions">
          <span>{t.portal}</span>
          <a className="admin-login__language" href={language === "es" ? "/admin/login" : "/es/admin/login"}>{t.lang}</a>
        </div>
      </div>

      <section className="admin-login__card" aria-label={t.portal}>
        <aside className="admin-login__story">
          <div className="admin-login__story-content">
            <span className="admin-login__eyebrow"><i aria-hidden="true" />{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <span className="admin-login__benefit"><b aria-hidden="true">✦</b>{t.passwordless}</span>
          </div>
          <div className="admin-login__rings" aria-hidden="true" />
        </aside>

        <section className="admin-login__form-panel" aria-live="polite">
          {verified ? (
            <div className="admin-login__content">
              <div className="admin-login__success-icon" aria-hidden="true">✓</div>
              <span className="admin-login__kicker">{t.passwordless}</span>
              <h2>{t.successTitle}</h2>
              <p className="admin-login__muted">{t.successText}</p>
              <button className="admin-login__button admin-login__button--secondary" type="button" onClick={startOver}>{t.startOver}</button>
            </div>
          ) : step === "email" ? (
            <div className="admin-login__content">
              <span className="admin-login__kicker">{t.eyebrow}</span>
              <h2>{t.portal}</h2>
              <p className="admin-login__muted">{t.intro}</p>
              <form onSubmit={requestCode} noValidate>
                <label htmlFor="admin-email">{t.emailLabel}</label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(event) => { setEmail(event.target.value); setSendError(""); }}
                  required
                />
                {sendError && <p className="admin-login__error" role="alert">{sendError}</p>}
                <button className="admin-login__button" type="submit" disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? t.sending : t.send}
                </button>
              </form>
            </div>
          ) : (
            <div className="admin-login__content">
              <span className="admin-login__kicker">{t.passwordless}</span>
              <h2>{t.codeTitle}</h2>
              <p className="admin-login__muted">{t.codeIntro} <strong>{email}</strong>.</p>
              {deliveryUncertain && <p className="admin-login__notice" role="status">{t.uncertain}</p>}
              <form onSubmit={submitCode} noValidate>
                <label htmlFor="admin-code">{t.codeLabel}</label>
                <input
                  id="admin-code"
                  className="admin-login__code-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setVerifyError(""); }}
                  required
                />
                {verifyError && <p className="admin-login__error" role="alert">{verifyError}</p>}
                <button className="admin-login__button" type="submit" disabled={verifyMutation.isPending}>
                  {verifyMutation.isPending ? t.verifying : t.verify}
                </button>
              </form>
              <div className="admin-login__links">
                <button type="button" onClick={() => { setSendError(""); sendMutation.mutate(email); }} disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? t.resending : t.resend}
                </button>
                <button type="button" onClick={startOver}>{t.changeEmail}</button>
              </div>
            </div>
          )}
        </section>
      </section>

      <footer className="admin-login__footer"><span>TipPal © {new Date().getFullYear()}</span><span>{t.footer}</span></footer>
    </main>
  );
}

export default function AdminLogin({ language }: { language: Language }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: false } } }));
  return <QueryClientProvider client={queryClient}><AdminLoginForm language={language} /></QueryClientProvider>;
}
