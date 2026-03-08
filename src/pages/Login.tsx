import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import armoiriesLogo from '@/assets/armoiries.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        sessionStorage.setItem('auth', 'true');
        toast.success('Connexion réussie');
        navigate('/');
      } else {
        toast.error('Identifiant ou mot de passe incorrect');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(220, 25%, 14%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <img src={armoiriesLogo} alt="المملكة المغربية" className="h-20 w-auto mb-3" />
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(0, 0%, 98%)' }}>
            <span style={{ color: 'hsl(20, 90%, 48%)' }}>Gestion</span> Électorale
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(220, 15%, 60%)' }}>
            Connectez-vous pour démarrer votre session
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border shadow-lg p-6" style={{ background: 'hsl(0, 0%, 98%)', borderColor: 'hsl(0, 0%, 83%)' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                autoFocus
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'hsl(220, 15%, 45%)' }}>
          © 2026 Gestion Électorale
        </p>
      </div>
    </div>
  );
};

export default Login;
