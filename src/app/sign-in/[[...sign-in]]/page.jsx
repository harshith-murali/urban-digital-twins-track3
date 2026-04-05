// src/app/sign-in/[[...sign-in]]/page.jsx
import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(135deg, #0a0f1a 0%, #0f1a0a 50%, #0a0f1a 100%)",
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: "absolute", top: "10%", left: "15%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,109,17,0.18) 0%, transparent 70%)",
        animation: "orbFloat 8s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "10%", right: "10%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(24,95,165,0.12) 0%, transparent 70%)",
        animation: "orbFloat 11s ease-in-out infinite reverse",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        {/* Branding */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="10" width="4" height="11" rx="1" fill="#639922" opacity="0.9"/>
              <rect x="6" y="6" width="5" height="15" rx="1" fill="#3B6D11"/>
              <rect x="12" y="3" width="6" height="18" rx="1" fill="#639922"/>
              <rect x="12" y="8" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
              <rect x="15" y="8" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
              <rect x="12" y="12" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
              <rect x="15" y="12" width="2" height="2" rx="0.4" fill="white" opacity="0.7"/>
            </svg>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "DM Sans, sans-serif", letterSpacing: "-0.3px" }}>
              Urban<span style={{ color: "#639922", fontWeight: 400 }}>Twins</span>
            </span>
          </div>
          <p style={{ fontSize: 13, color: "rgba(232,234,240,0.5)", fontFamily: "DM Sans, sans-serif" }}>
            Infrastructure Intelligence Platform
          </p>
        </div>

        <SignIn />
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}