import { Link } from "react-router-dom";
import { useApp } from "../context.jsx";
import { Logo } from "./ui.jsx";
import { channels } from "../channels.jsx";

export default function Footer() {
  const { t, data } = useApp();
  const activeChannels = channels(data);
  return (
    <footer className="foot">
      <div className="foot-bar" aria-hidden="true" />
      <div className="wrap foot-in">
        <Link className="logo" to="/" aria-label="DARCX"><Logo /></Link>
        <p className="foot-desc">{t("f_desc")}</p>
        {activeChannels.length > 0 && (
          <div className="foot-soc">
            {activeChannels.map(channel => (
              <a key={channel.id} className="soc" href={channel.href(data.contact[channel.id])} target="_blank" rel="noopener" aria-label={channel.label(t)} title={channel.label(t)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{channel.icon}</svg>
              </a>
            ))}
          </div>
        )}
        <p className="foot-end">{t("f_rights")}</p>
      </div>
    </footer>
  );
}
