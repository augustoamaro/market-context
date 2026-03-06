import { AlertTriangle, Info, Inbox } from "lucide-react";

interface Props {
  title: string;
  message: string;
  tone?: "error" | "empty" | "info";
}

const toneStyles = {
  error: {
    shell: "border-danger/20 bg-danger/8",
    text: "text-danger",
    Icon: AlertTriangle,
  },
  empty: {
    shell: "border-white/10 bg-white/[0.02]",
    text: "text-text-muted",
    Icon: Inbox,
  },
  info: {
    shell: "border-primary/20 bg-primary/8",
    text: "text-primary",
    Icon: Info,
  },
} as const;

export default function SectionStatusCard({
  title,
  message,
  tone = "empty",
}: Props) {
  const { shell, text, Icon } = toneStyles[tone];

  return (
    <div className={`bento-card rounded-2xl p-6 sm:p-8 ${shell}`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-xl border border-white/10 bg-black/20 p-3 ${text}`}>
          <Icon className="size-5" />
        </div>

        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            {title}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-text-muted">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
