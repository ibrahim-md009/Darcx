import { useEffect, useState } from "react";
import { useApp } from "../context.jsx";
import { useLocation } from "react-router-dom";
import { Arrow, PageHead } from "../components/ui.jsx";
import SelectSheet from "../components/SelectSheet.jsx";
import { channels } from "../channels.jsx";

export default function Contact() {
  const { t, localize, data } = useApp();
  const currentLocation = useLocation();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [service, setService] = useState(data.services[0].id);
  const [note, setNote] = useState({ text: "", err: false });
  const [triedToSubmit, setTriedToSubmit] = useState(false);

  /* /contact?service=websites pre-selects the project type */
  useEffect(() => {
    const serviceFromUrl = new URLSearchParams(currentLocation.search).get("service");
    if (serviceFromUrl && (serviceFromUrl === "other" || data.services.some((item) => item.id === serviceFromUrl))) setService(serviceFromUrl);
  }, [currentLocation.search, data]);

  const options = [
    ...data.services.map((item) => ({ value: item.id, label: localize(item.name), accent: item.accent })),
    { value: "other", label: t("c_other"), accent: "var(--sand)" },
  ];
  const serviceLabel = options.find((option) => option.value === service).label;
  const contactMethods = channels(data);

  const resetForm = () => {
    setTriedToSubmit(false);
    setName("");
    setContact("");
    setMessage("");
    setService(data.services[0].id);
  };

  /* No server needed: the request opens WhatsApp with the message ready (email / clipboard if WhatsApp is not set in data.js) */
  function submit(event) {
    event.preventDefault();
    const cleanName = name.trim(),
      cleanContact = contact.trim(),
      cleanMessage = message.trim();
    if (!cleanName || !cleanContact || !cleanMessage) {
      setTriedToSubmit(true);
      setNote({ text: t("c_err"), err: true });
      return;
    }
    const text =
      t("c_name") + ": " + cleanName + "\n" + t("c_contact") + ": " + cleanContact + "\n" + t("c_service") + ": " + serviceLabel + "\n\n" + cleanMessage;
    const contactInfo = data.contact;
    if (contactInfo.whatsapp) {
      window.open("https://wa.me/" + contactInfo.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      setNote({ text: t("c_ok_wa"), err: false });
      resetForm();
    } else if (contactInfo.email) {
      location.href =
        "mailto:" +
        contactInfo.email +
        "?subject=" +
        encodeURIComponent(t("brand") + " — " + serviceLabel) +
        "&body=" +
        encodeURIComponent(text);
      setNote({ text: t("c_ok_mail"), err: false });
      resetForm();
    } else {
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {});
      setNote({ text: t("c_ok_copy"), err: false });
    }
  }

  return (
    <>
      <PageHead title={t("c_page_t")} sub={t("c_page_p")} />
      <section className="sec">
        <div className="wrap cgrid">
          <form className="cform rv" onSubmit={submit} noValidate>
            <h2>{t("c_form_t")}</h2>
            <div className={"fld" + (triedToSubmit && !name.trim() ? " bad" : "")}>
              <input
                id="cn"
                placeholder=" "
                autoComplete="name"
                required
                aria-invalid={triedToSubmit && !name.trim()}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <label htmlFor="cn">{t("c_name")}</label>
            </div>
            <div className={"fld" + (triedToSubmit && !contact.trim() ? " bad" : "")}>
              <input
                id="cc"
                placeholder=" "
                autoComplete="email"
                required
                dir="auto"
                aria-invalid={triedToSubmit && !contact.trim()}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
              />
              <label htmlFor="cc">{t("c_contact")}</label>
            </div>
            <SelectSheet label={t("c_service")} options={options} value={service} onChange={setService} />
            <div className={"fld" + (triedToSubmit && !message.trim() ? " bad" : "")}>
              <textarea
                id="cm"
                placeholder=" "
                required
                aria-invalid={triedToSubmit && !message.trim()}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <label htmlFor="cm">{t("c_msg")}</label>
            </div>
            <button className="btn btn-fill" type="submit">
              {t("c_send")}
              <Arrow />
            </button>
            <p className={"note" + (note.err ? " err" : "")} role={note.err ? "alert" : "status"}>
              {note.text}
            </p>
          </form>

          <aside className="cside rv" style={{ "--d": ".1s" }}>
            <h2>{t("c_methods")}</h2>
            {contactMethods.length ? (
              contactMethods.slice(0, 2).map((method) => (
                <a key={method.id} className="cm" href={method.href(data.contact[method.id])} target="_blank" rel="noopener">
                  <span className="dot" style={{ background: method.dot }} />
                  <span>
                    <b>{method.label(t)}</b>
                    <small dir="ltr">{method.show(data.contact[method.id])}</small>
                  </span>
                  <Arrow />
                </a>
              ))
            ) : (
              <p className="mut">{t("c_none")}</p>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
