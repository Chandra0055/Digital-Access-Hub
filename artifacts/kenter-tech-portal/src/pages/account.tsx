import { useAuth } from '@/contexts/auth-context';
import { useGetMySubscription, useCreateSubscription, getGetMySubscriptionQueryKey } from '@workspace/api-client-react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, User, Mail, Calendar, Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function AccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useGetMySubscription({
    query: { queryKey: getGetMySubscriptionQueryKey() },
  });

  const createSubscriptionMutation = useCreateSubscription();

  const handleSubscribe = (planType: 'monthly' | 'annual' | 'lifetime') => {
    createSubscriptionMutation.mutate(
      { data: { planType } },
      {
        onSuccess: () => {
          toast({
            title: 'Subscription created',
            description: `You are now subscribed to the ${planType} plan`,
          });
          queryClient.invalidateQueries({ queryKey: getGetMySubscriptionQueryKey() });
        },
        onError: (error: any) => {
          toast({
            title: 'Subscription failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trial';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and subscription</p>
        </div>

        <div className="grid gap-6">
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

          <div className="border border-card-border bg-card rounded p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscription
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan Type</span>
                  <span className="text-sm font-mono uppercase">{subscription.planType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={subscription.status} />
                </div>
                {subscription.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm font-mono">
                      {format(new Date(subscription.expiresAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-6">
                  You don't have an active subscription. Choose a plan to get started.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PlanCard
                    name="Monthly"
                    price="$29"
                    period="per month"
                    features={['All tools access', 'Priority support', 'Cancel anytime']}
                    onSubscribe={() => handleSubscribe('monthly')}
                    isPending={createSubscriptionMutation.isPending}
                  />
                  <PlanCard
                    name="Annual"
                    price="$290"
                    period="per year"
                    badge="Save 17%"
                    features={['All tools access', 'Priority support', '2 months free']}
                    onSubscribe={() => handleSubscribe('annual')}
                    isPending={createSubscriptionMutation.isPending}
                  />
                  <PlanCard
                    name="Lifetime"
                    price="$999"
                    period="one-time"
                    badge="Best Value"
                    features={['All tools access', 'Lifetime updates', 'VIP support']}
                    onSubscribe={() => handleSubscribe('lifetime')}
                    isPending={createSubscriptionMutation.isPending}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  onSubscribe: () => void;
  isPending: boolean;
}

function PlanCard({ name, price, period, badge, features, onSubscribe, isPending }: PlanCardProps) {
  return (
    <div className="border border-border rounded p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{name}</h3>
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">
            {badge}
          </span>
        )}
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold">{price}</p>
        <p className="text-xs text-muted-foreground font-mono">{period}</p>
      </div>
      <ul className="space-y-2 mb-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onSubscribe}
        disabled={isPending}
        className="w-full"
        data-testid={`button-subscribe-${name.toLowerCase()}`}
      >
        Subscribe
      </Button>
    </div>
  );
}
