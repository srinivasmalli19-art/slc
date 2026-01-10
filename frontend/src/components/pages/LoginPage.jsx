import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Stethoscope, Shield, Users, ChevronRight, 
  Phone, Lock, Eye, EyeOff, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

const loginSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['farmer', 'paravet', 'veterinarian', 'admin']),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  role: z.enum(['farmer', 'paravet', 'veterinarian', 'admin']),
  village: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register: registerUser, guestLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('farmer');

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
      role: 'farmer',
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      role: 'farmer',
      village: '',
      district: '',
      state: '',
    },
  });

  const roleOptions = [
    { value: 'farmer', label: 'Farmer', icon: User, description: 'Register animals, view records' },
    { value: 'paravet', label: 'Paravet', icon: Users, description: 'Field data entry, samples' },
    { value: 'veterinarian', label: 'Veterinarian', icon: Stethoscope, description: 'Clinical authority, diagnostics' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'System administration' },
  ];

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.phone, data.password, data.role);
      toast.success(`Welcome back, ${user.name}!`);
      navigateByRole(user.role);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success('Registration successful! Please login.');
      loginForm.setValue('phone', data.phone);
      loginForm.setValue('role', data.role);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await guestLogin();
      toast.success('Welcome, Guest!');
      navigate('/guest/area');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateByRole = (role) => {
    switch (role) {
      case 'farmer':
        navigate('/farmer/animals');
        break;
      case 'paravet':
        navigate('/farmer/animals'); // Paravet uses similar interface
        break;
      case 'veterinarian':
        navigate('/vet/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white safe-area-inset">
      {/* Header */}
      <header className="slc-header py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
              SLC - SMART LIVESTOCK CARE
            </h1>
            <p className="text-green-100 text-sm">Digital Veterinary Health Management</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left - Role Selection */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Select Your Role
              </h2>
              <p className="text-slate-600 mt-2">Choose how you want to access the system</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => {
                    setSelectedRole(role.value);
                    loginForm.setValue('role', role.value);
                    registerForm.setValue('role', role.value);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedRole === role.value
                      ? 'border-primary bg-green-50 shadow-md'
                      : 'border-slate-200 hover:border-green-300 bg-white'
                  }`}
                  data-testid={`role-${role.value}-btn`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    selectedRole === role.value ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <role.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-800">{role.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                </button>
              ))}
            </div>

            {/* Guest Access */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-amber-800">Guest Access</h3>
                    <p className="text-sm text-amber-700">No registration required</p>
                  </div>
                  <Button 
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700"
                    data-testid="guest-login-btn"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        Continue as Guest
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Login/Register Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Welcome to SLC</CardTitle>
              <CardDescription>Login or create an account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-6">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-phone">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="login-phone"
                          type="tel"
                          placeholder="Enter mobile number"
                          className="pl-10"
                          {...loginForm.register('phone')}
                          data-testid="login-phone-input"
                        />
                      </div>
                      {loginForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter password"
                          className="pl-10 pr-10"
                          {...loginForm.register('password')}
                          data-testid="login-password-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <input type="hidden" {...loginForm.register('role')} value={selectedRole} />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      data-testid="login-submit-btn"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="mt-6">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Full Name</Label>
                      <Input
                        id="register-name"
                        placeholder="Enter your full name"
                        {...registerForm.register('name')}
                        data-testid="register-name-input"
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Mobile Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="Enter mobile number"
                          className="pl-10"
                          {...registerForm.register('phone')}
                          data-testid="register-phone-input"
                        />
                      </div>
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create password"
                          className="pl-10"
                          {...registerForm.register('password')}
                          data-testid="register-password-input"
                        />
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-village">Village</Label>
                        <Input
                          id="register-village"
                          placeholder="Your village"
                          {...registerForm.register('village')}
                          data-testid="register-village-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-district">District</Label>
                        <Input
                          id="register-district"
                          placeholder="Your district"
                          {...registerForm.register('district')}
                          data-testid="register-district-input"
                        />
                      </div>
                    </div>

                    <input type="hidden" {...registerForm.register('role')} value={selectedRole} />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      data-testid="register-submit-btn"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Register as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-slate-100 rounded-lg text-center">
          <p className="text-xs text-slate-600">
            <strong>Information shown is for reference only.</strong><br />
            Diagnosis and treatment decisions are made by <strong>veterinarians</strong>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
