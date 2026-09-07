import { Wallet } from "@gravity-ui/icons";
import { Chip, Typography } from "@heroui/react";

export default function DashboardCards({
  icon,
  status,
  title,
  body,
  highlighted = false,
}) {
  const Icon = icon ?? Wallet;
  const textColor = highlighted ? "text-white" : "text-zinc-800";

  return (
    <div
      className={`flex min-h-40 w-full flex-col rounded-2xl p-6 shadow-md ${
        highlighted
          ? "bg-gradient-to-br from-[#2f82e8] to-[#1554b7]"
          : "bg-white"
      }`}
    >
      <div className="flex gap-3 w-full justify-between mb-auto">
        <div className="flex flex-col">
          <div
            className={`mb-3 w-fit rounded-xl p-2 ${
              highlighted
                ? "bg-white text-[#1554b7]"
                : "bg-zinc-200 text-zinc-800"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <Typography type="h4" weight="normal" className={textColor}>
            {title}
          </Typography>
        </div>
        <Chip
          color={status >= 0 ? "success" : "danger"}
          variant="primary"
          className="h-fit"
        >
          <Chip.Label>
            {status === 0 ? "0%" : status > 0 ? `+${status}%` : `${status}%`}
          </Chip.Label>
        </Chip>
      </div>
      <Typography type="h2" className={textColor}>
        {body}
      </Typography>
    </div>
  );
}
