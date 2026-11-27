import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Stack,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Business,
  Assignment,
  Task,
  TrendingUp,
  ContactPhone,
  NoteAdd as NoteAddIcon,
  PersonAdd as PersonAddIcon,
  ConfirmationNumber as TicketIcon,
} from '@mui/icons-material';
import { dashboardApi } from '@/api/endpoints';
import { usePermissions } from '@/hooks/usePermissions';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { WonThisMonthTile } from '@/components/dashboard/WonThisMonthTile';
import { useDefaultDealCurrency } from '@/pages/deals/useDefaultDealCurrency';
import { formatDate } from '@/utils/date';
import { Button } from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', position: 'relative', '&:before': { content: '""', position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0, width: 4, bgcolor: color, borderRadius: '0 4px 4px 0' } }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: '#172033', fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Typography>
            {trend !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp 
                  fontSize="small" 
                  sx={{ color: trend > 0 ? 'success.main' : 'error.main' }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: trend > 0 ? 'success.main' : 'error.main',
                    ml: 0.5 
                  }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48, borderRadius: 3, boxShadow: '0 6px 16px rgba(37,99,235,0.12)' }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();

  // GET /dashboard/stats is restricted to admin, sales and support on the
  // backend; customer-role users would only receive a 403, so skip the
  // request and the stats section entirely for them.
  const canViewStats = can('dashboard.view');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.getStats,
    enabled: canViewStats,
  });

  // The remaining dashboard endpoints share the stats guard: admin, sales
  // and support only, so customer-role users must not call them either.
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activities'],
    queryFn: () => dashboardApi.getRecentActivities(10),
    enabled: canViewStats,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard', 'sales'],
    queryFn: () => dashboardApi.getSalesPerformance('month'),
    enabled: canViewStats,
  });

  const { data: upcomingTasks, isLoading: upcomingTasksLoading } = useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => dashboardApi.getUpcomingTasks(5),
    enabled: canViewStats,
  });

  // Deals are admin and sales only (GET /dashboard/pipeline answers 403 to
  // support and customer), so the other roles get neither the widgets nor the
  // request. The API scopes sales to its own deals.
  const canViewDeals = can('deals.view');
  // Ticket creation is admin and support on the API and the /tickets/new route.
  const canCreateTicket = can('tickets.create');
  // The /customers route needs the read key; without it the button would
  // only lead to /unauthorized.
  const canViewCustomers = can('customers.view');

  const {
    data: pipeline,
    isLoading: pipelineLoading,
    isError: pipelineError,
  } = useQuery({
    queryKey: ['dashboard', 'pipeline'],
    queryFn: dashboardApi.getPipeline,
    enabled: canViewDeals,
  });
  const defaultCurrency = useDefaultDealCurrency(canViewDeals);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#172033' }}>
            داشبورد مدیریتی
          </Typography>
          <Typography variant="body2" color="text.secondary">
            نمای کلی عملکرد فروش، مشتریان و فعالیت‌های تیم
          </Typography>
        </Box>
        <Chip label="گزارش ماه جاری" variant="outlined" sx={{ bgcolor: '#fff', borderColor: '#e3e8f0', fontWeight: 600 }} />
      </Box>
      
      {/* Stats Cards (hidden for customer-role users, who may not read them) */}
      {canViewStats && (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          mb: 3
        }}
      >
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={140} />
          ) : (
            <StatCard
              title="کل سرنخ‌ها"
              value={stats?.total_leads || 0}
              icon={<ContactPhone />}
              color="primary.main"
              trend={12}
            />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={140} />
          ) : (
            <StatCard
              title="کل مشتریان"
              value={stats?.total_customers || 0}
              icon={<Business />}
              color="success.main"
              trend={8}
            />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={140} />
          ) : (
            <StatCard
              title="تیکت‌های باز"
              value={stats?.open_tickets || 0}
              icon={<Assignment />}
              color="warning.main"
              trend={-5}
            />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={140} />
          ) : (
            <StatCard
              title="پیگیری‌های در انتظار"
              value={stats?.pending_tasks || 0}
              icon={<Task />}
              color="info.main"
            />
          )}
        </Box>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={140} />
          ) : (
            <StatCard
              title="نرخ تبدیل"
              value={`${(stats?.conversion_rate || 0).toFixed(1)}%`}
              icon={<TrendingUp />}
              color="success.main"
            />
          )}
        </Box>
      </Box>
      )}

      {/* Deal widgets (admin and sales only) */}
      {canViewDeals && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' } }}>
            <PipelineChart
              stages={pipeline?.stages}
              defaultCurrency={defaultCurrency}
              isLoading={pipelineLoading}
              isError={pipelineError}
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' } }}>
            <WonThisMonthTile
              wonThisMonth={pipeline?.won_this_month}
              isLoading={pipelineLoading}
              isError={pipelineError}
            />
          </Box>
        </Box>
      )}

      {/* دسترسی سریع Panel */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          دسترسی سریع
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/leads/new')}
          >
            ثبت سرنخ جدید
          </Button>
          {canCreateTicket && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<TicketIcon />}
              onClick={() => navigate('/tickets/new')}
            >
              ثبت تیکت
            </Button>
          )}
          <Button
            variant="contained"
            color="info"
            startIcon={<NoteAddIcon />}
            onClick={() => navigate('/tasks/new')}
          >
            ثبت پیگیری
          </Button>
          {canViewCustomers && (
            <Button
              variant="outlined"
              startIcon={<Business />}
              onClick={() => navigate('/customers')}
            >
              مشاهده مشتریان
            </Button>
          )}
        </Box>
      </Paper>

      {/* Charts and Activities (same role guard as the stats endpoints) */}
      {canViewStats && (
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {/* عملکرد فروش Chart */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' } }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                عملکرد فروش
              </Typography>
              {salesLoading && <Skeleton variant="rectangular" height={300} />}
              {salesData && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData.datasets[0].data.map((value, index) => ({
                    name: salesData.labels[index],
                    value,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#1976d2"
                      fill="#1976d2"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Box>

          {/* فعالیت‌های اخیر and پیگیری‌های پیش‌رو */}
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' } }}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  فعالیت‌های اخیر
                </Typography>
                {activitiesLoading ? (
                  <Skeleton variant="rectangular" height={140} />
                ) : activities && activities.length > 0 ? (
                  <List dense disablePadding>
                    {activities.map((activity) => (
                      <ListItem key={activity.id} disableGutters>
                        <ListItemText
                          primary={activity.title}
                          secondary={`${activity.description} — ${formatDate(activity.created_at, 'MMM dd, yyyy')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">موردی برای نمایش وجود ندارد</Typography>
                )}
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  پیگیری‌های پیش‌رو
                </Typography>
                {upcomingTasksLoading ? (
                  <Skeleton variant="rectangular" height={140} />
                ) : upcomingTasks && upcomingTasks.length > 0 ? (
                  <List dense disablePadding>
                    {upcomingTasks.map((task) => (
                      <ListItem
                        key={task.id}
                        disableGutters
                        secondaryAction={
                          <Chip label={task.priority} size="small" variant="outlined" />
                        }
                      >
                        <ListItemText
                          primary={task.title}
                          secondary={`سررسید ${formatDate(task.due_date, 'MMM dd, yyyy')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">موردی برای نمایش وجود ندارد</Typography>
                )}
              </Paper>
            </Stack>
          </Box>
        </Box>
      </Stack>
      )}
    </Box>
  );
};