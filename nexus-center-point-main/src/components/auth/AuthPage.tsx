import * as React from 'react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  ShieldCheck, 
  Gift,
  ArrowRight,
  RefreshCw,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import nexusMark from '@/assets/nexus-mark.png.asset.json';

function generateCaptchaCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function AuthPage() {
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = React.useState(false);
  const [captchaCode, setCaptchaCode] = React.useState('');
  const [captchaInput, setCaptchaInput] = React.useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (mode === 'register') {
      setCaptchaCode(generateCaptchaCode());
      setCaptchaInput('');
    }
  }, [mode]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput('');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'register') {
      if (captchaInput.trim() !== captchaCode) {
        toast.error('Código de verificação incorreto. Tente o novo código gerado.');
        setCaptchaCode(generateCaptchaCode());
        setCaptchaInput('');
        return;
      }
      toast.success('Conta criada com sucesso!');
    } else {
      toast.success('Login realizado com sucesso!');
    }
    
    // Simulate auth success
    setTimeout(() => {
      navigate({ to: '/app' });
    }, 1000);
  };

  const isRegisterDisabled = mode === 'register' && captchaInput.trim().length !== 4;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-x-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col items-center"
        >
          <div className="relative mb-3">
            <img
              src={nexusMark.url}
              alt="Nexus Tech"
              className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(163,230,53,0.35)]"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            NEXUS <span className="text-primary">TECH</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </h2>
              <p className="text-muted text-sm">
                {mode === 'login' ? 'Entre para acessar sua conta' : 'Junte-se a nós e comece a ganhar'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'login' ? (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      placeholder="Telefone ou e-mail" 
                      className="pl-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha" 
                      className="pl-12 pr-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black" />
                      <label htmlFor="remember" className="text-sm text-muted cursor-pointer">Lembrar de mim</label>
                    </div>
                    <button type="button" className="text-sm text-primary hover:underline">Esqueceu sua senha?</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      placeholder="Nome de usuário" 
                      className="pl-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      placeholder="Número de telefone" 
                      className="pl-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha" 
                      className="pl-12 pr-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                    <Input 
                      placeholder="Código de convite (se tiver)" 
                      className="pl-12 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>

                  {/* Captcha Verification */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={captchaInput}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setCaptchaInput(value);
                        }}
                        placeholder="Digite os 4 números"
                        className="pl-11 bg-surface border-white/5 h-14 rounded-2xl focus:border-primary/50 focus:ring-primary/20"
                      />
                    </div>

                    <div className="flex items-center gap-1 h-14 px-3 rounded-2xl bg-surface border border-white/5 select-none">
                      {captchaCode.split('').map((digit, index) => (
                        <span
                          key={index}
                          className={cn(
                            "text-base font-bold text-primary/90",
                            index % 2 === 0 ? "rotate-1" : "-rotate-1"
                          )}
                        >
                          {digit}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={handleRefreshCaptcha}
                        className="ml-1.5 p-1 rounded-lg text-muted hover:text-primary transition-colors"
                        aria-label="Atualizar código de verificação"
                        title="Atualizar código"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                disabled={isRegisterDisabled}
                className={cn(
                  "w-full h-14 rounded-2xl font-bold text-lg shadow-[0_4px_20px_rgba(163,230,53,0.3)]",
                  isRegisterDisabled
                    ? "bg-primary/40 text-black/60 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-black"
                )}
              >
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
              </Button>
            </form>

          </motion.div>
        </AnimatePresence>

        {/* Security Footer */}
        <div className="mt-8 w-full p-4 rounded-2xl bg-surface/50 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Sua conta 100% segura</p>
            <p className="text-xs text-muted">Seus dados protegidos com tecnologia de ponta.</p>
          </div>
        </div>

        <button 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-8 text-sm font-medium text-white flex items-center gap-2 hover:text-primary transition-colors"
        >
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
          <span className="text-primary font-bold">
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </span>
          <ArrowRight className="w-4 h-4 text-primary" />
        </button>

        <div className="mt-8 flex items-center gap-2 text-xs text-muted">
          <ShieldCheck className="w-3 h-3 text-primary" />
          Protegido por tecnologia avançada
        </div>
      </div>
    </div>
  );
}
