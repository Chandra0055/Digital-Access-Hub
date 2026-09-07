import { useAuth } from '@/contexts/auth-context';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { getSubscriptionState } from '@/lib/subscription-expiry';

export default function AccountPage() {
  const { user } = useAuth();

  const subscription = getSubscriptionState(
    user?.subscriptionStatus,
    user?.validUntil,
  );
  const validUntil = subscription.validUntil;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile information</p>
        </div>

        <div className="grid gap-6">
          {/* Profile */}
          <div className="border border-card-border bg-card rounded p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-mono">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-mono uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-mono">
                  {user?.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Access Info */}
          <div className="border border-card-border bg-card rounded p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Access
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                {subscription.isActive ? (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-600 border border-green-500/20">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-500/20">
                    {subscription.isExpiryInvalid ? 'UNAVAILABLE' : subscription.isExpired ? 'EXPIRED' : 'INACTIVE'}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Valid Until
                </span>
                <span className="text-sm font-mono">
                  {subscription.isExpiryInvalid
                    ? 'Date unavailable'
                    : validUntil
                      ? format(validUntil, 'MMM dd, yyyy')
                      : 'Unlimited'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                Your tool access is managed by your administrator. Contact your admin to update your access or validity period.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
