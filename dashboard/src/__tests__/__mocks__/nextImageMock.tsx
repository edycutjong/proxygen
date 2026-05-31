import React from "react";

export default function NextImage(props: Record<string, unknown>) {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
}
