import { Typography } from "@heroui/react";

export default function TopBar({ title, body, emoji }) {
  const date = new Date();

  // Configure the formatting options
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = date.toLocaleDateString("en-US", options);

  return (
    <div className="flex flex-col xl:flex-row justify-between">
      <div className="flex flex-col">
        <Typography type="h2" className="flex gap-2">
          {title}
          <img src={emoji} alt="Page emoji" className="w-8 h-8 aspect-square" />
        </Typography>
        <Typography color="muted" type="body-sm">
          {body}
        </Typography>
      </div>
      <Typography color="muted" type="body-sm">
        {formattedDate}
      </Typography>
    </div>
  );
}
