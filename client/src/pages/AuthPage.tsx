import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BarChart2, Gamepad2, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Panel - Brand */}
      <div className="flex-1 relative flex flex-col justify-center px-8 lg:px-24 py-12 border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-[#0A0A0B] to-[#0A0A0B]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">B</span>
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">bezi.ai</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] mb-6">
            Growth intelligence for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">game studios</span>.
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg mb-12 leading-relaxed">
            Identify high-potential AA and AAA studios. Track development pipelines. 
            Automate your outreach workflow with data-driven insights.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            {[
              { icon: Gamepad2, text: "Engine Detection" },
              { icon: BarChart2, text: "Steam Metrics Analysis" },
              { icon: Users, text: "Studio Intelligence" },
              { icon: ArrowRight, text: "Lead Pipeline CRM" },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Login */}
      <div className="lg:w-[480px] bg-card/50 backdrop-blur-sm flex items-center justify-center p-8">
        <Card className="w-full max-w-md bg-black/40 border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to access your growth dashboard</p>
          </div>

          <Button 
            onClick={handleLogin}
            size="lg" 
            className="w-full h-12 text-base bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10"
          >
            Continue with Replit
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </Card>
      </div>
    </div>
  );
}
