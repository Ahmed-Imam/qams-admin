import React from "react";
import { Shield } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="mb-8 animate-pulse-glow p-6 rounded-3xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
            <Shield className="w-20 h-20 text-primary-400" />
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent mb-6">
            QAMS Admin
          </h1>
          
          <p className="text-xl text-secondary-300 max-w-md leading-relaxed">
            Quality Assurance Management System
            <span className="block mt-2 text-secondary-400 text-lg">
              Centralized administration portal
            </span>
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8">
            {[
              { label: "Clients", icon: "🏢" },
              { label: "Users", icon: "👥" },
              { label: "Roles", icon: "🔐" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="flex flex-col items-center p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm animate-fadeIn"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="text-3xl mb-2">{item.icon}</span>
                <span className="text-sm text-secondary-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 animate-fadeIn">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20">
                  <Shield className="w-8 h-8 text-primary-400" />
                </div>
                <span className="text-2xl font-bold text-white">QAMS Admin</span>
              </div>
            </div>
            
            {children}
          </div>
          
          <p className="text-center text-secondary-500 text-sm mt-6">
            © 2024 QAMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
