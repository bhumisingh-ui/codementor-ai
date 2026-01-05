"use client";

import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const StyledWrapper = styled.div`
  .sazzad-card {
    position: relative;
    width: var(--card-w, 260px);
    height: var(--card-h, 160px);
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    background: rgba(10, 10, 10, 0.6);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.08);

    box-shadow:
      0 0 40px rgba(0, 255, 157, 0.12),
      0 20px 40px rgba(0, 0, 0, 0.35);

    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .sazzad-card:hover {
    transform: translateY(-4px);
    box-shadow:
      0 0 60px rgba(0, 255, 157, 0.25),
      0 28px 60px rgba(0, 0, 0, 0.45);
  }

  .sazzad-bg {
    position: absolute;
    inset: 8px;
    background: linear-gradient(
      145deg,
      rgba(18, 18, 18, 0.95),
      rgba(30, 30, 30, 0.7)
    );
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    z-index: 2;
  }

  .sazzad-aurora {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--aurora-size, 200px);
    height: var(--aurora-size, 200px);
    border-radius: 50%;
    filter: blur(28px);
    z-index: 1;

    background: radial-gradient(
      circle,
      var(--aurora-start, rgba(0, 255, 157, 0.85)),
      var(--aurora-mid, rgba(6, 182, 212, 0.35)),
      transparent
    );

    animation: sazzad-aurora-move 6.5s infinite ease-in-out;
    opacity: 0.8;
  }

  @keyframes sazzad-aurora-move {
    0% { transform: translate(-60%, -60%) scale(1); }
    30% { transform: translate(10%, -40%) scale(1.15); }
    60% { transform: translate(20%, 20%) scale(1.05); }
    80% { transform: translate(-40%, 10%) scale(1.2); }
    100% { transform: translate(-60%, -60%) scale(1); }
  }

  .content {
    position: relative;
    z-index: 3;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 18px;
    color: #ededed;
  }

  .title { font-size: 0.85rem; color: #9ca3af; }
  .value { font-size: 1.75rem; font-weight: 800; }
`;

export default function AuroraCard({
  title,
  value,
  icon,
  children,
  width = 260,
  height = 160,
  auroraStart,
  auroraMid,
  className,
}) {
  return (
    <StyledWrapper style={{
      ["--card-w"]: `${width}px`,
      ["--card-h"]: `${height}px`,
      ["--aurora-size"]: `${Math.max(width, height)}px`,
      ["--aurora-start"]: auroraStart || "rgba(0, 255, 157, 0.85)",
      ["--aurora-mid"]: auroraMid || "rgba(6, 182, 212, 0.35)",
    }}>
      <motion.div className={`sazzad-card ${className || ""}`} whileHover={{ scale: 1.02 }}>
        <div className="sazzad-bg" />
        <div className="sazzad-aurora" />
        <div className="content">
          {icon && <div className="mr-2 opacity-90">{icon}</div>}
          <div className="flex-1">
            {title && <div className="title">{title}</div>}
            {value && <div className="value">{value}</div>}
            {children}
          </div>
        </div>
      </motion.div>
    </StyledWrapper>
  );
}
