import { useEffect, useState } from "react";
import { formatLocalTimestamp, formatLocalHHMM } from "../utils/time";

type Props =
  | { variant: "timestamp"; value: string | number | Date; options?: Intl.DateTimeFormatOptions }
  | { variant: "time"; value: string; options?: Intl.DateTimeFormatOptions };

export default function LocalTime(props: Props) {
  const [text, setText] = useState("—");

  useEffect(() => {
    if (props.variant === "timestamp") {
      setText(formatLocalTimestamp(props.value, props.options));
    } else {
      setText(formatLocalHHMM(props.value, props.options));
    }
  }, [props]);

  // Avoid hydration mismatches when SSR renders "—" and client replaces it
  return <span suppressHydrationWarning>{text}</span>;
}