import React from "react";
import educaiLogo from "../../assets/educai-logo.png";

export default function Logo({
  dark = false,
}) {
  return (
    <div className="flex items-center gap-3">
      <img src={educaiLogo} alt="EduAI" className="h-11 w-20 rounded-lg object-contain" />
    </div>
  );
}
