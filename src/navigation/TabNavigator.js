import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { shadows } from '../constants/shadows';
import { AppText } from '../components/common/AppText';

// Home
import HomeScreen from '../screens/home/HomeScreen';
import AnnouncementDetailScreen from '../screens/home/AnnouncementDetailScreen';

// Messages
import ConversationsScreen from '../screens/messages/ConversationsScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import NewMessageScreen from '../screens/messages/NewMessageScreen';
import ChatInfoScreen from '../screens/messages/ChatInfoScreen';
import NewGroupScreen from '../screens/messages/NewGroupScreen';

// Channels
import ChannelsScreen from '../screens/channels/ChannelsScreen';
import ChannelThreadScreen from '../screens/channels/ChannelThreadScreen';
import ChannelInfoScreen from '../screens/channels/ChannelInfoScreen';
import DiscoverChannelsScreen from '../screens/channels/DiscoverChannelsScreen';
import CreateChannelScreen from '../screens/channels/CreateChannelScreen';

// Schedule
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import EventDetailScreen from '../screens/schedule/EventDetailScreen';
import CreateEventScreen from '../screens/schedule/CreateEventScreen';
import TrainingListScreen from '../screens/schedule/TrainingListScreen';

// More
import MoreScreen from '../screens/more/MoreScreen';
import ProfileScreen from '../screens/more/ProfileScreen';
import EditProfileScreen from '../screens/more/EditProfileScreen';
import NotificationsScreen from '../screens/more/NotificationsScreen';
import StaffDirectoryScreen from '../screens/more/StaffDirectoryScreen';
import StaffProfileScreen from '../screens/more/StaffProfileScreen';
import DepartmentsScreen from '../screens/more/DepartmentsScreen';
import FilesScreen from '../screens/more/FilesScreen';
import SettingsScreen from '../screens/more/SettingsScreen';
import PrivacySecurityScreen from '../screens/more/PrivacySecurityScreen';
import TrustedDevicesScreen from '../screens/more/TrustedDevicesScreen';
import AccountSettingsScreen from '../screens/more/AccountSettingsScreen';
import AboutScreen from '../screens/more/AboutScreen';
import AdminPanelScreen from '../screens/more/AdminPanelScreen';
import AdminDeviceApprovalsScreen from '../screens/more/AdminDeviceApprovalsScreen';
import AdminManageChannelsScreen from '../screens/more/AdminManageChannelsScreen';
import AdminSendAnnouncementScreen from '../screens/more/AdminSendAnnouncementScreen';
import AdminSystemAnalyticsScreen from '../screens/more/AdminSystemAnalyticsScreen';
import AdminActivityLogsScreen from '../screens/more/AdminActivityLogsScreen';
import AdminAddStaffScreen from '../screens/more/AdminAddStaffScreen';
import AdminStaffCredentialsScreen from '../screens/more/AdminStaffCredentialsScreen';

// Clinic
import ClinicHubScreen from '../screens/clinic/ClinicHubScreen';
import AppointmentsListScreen from '../screens/clinic/AppointmentsListScreen';
import AppointmentDetailScreen from '../screens/clinic/AppointmentDetailScreen';
import BookAppointmentScreen from '../screens/clinic/BookAppointmentScreen';
import PatientDirectoryScreen from '../screens/clinic/PatientDirectoryScreen';
import PatientProfileScreen from '../screens/clinic/PatientProfileScreen';
import AddEditPatientScreen from '../screens/clinic/AddEditPatientScreen';
import TreatmentNoteScreen from '../screens/clinic/TreatmentNoteScreen';
import InvoicesListScreen from '../screens/clinic/InvoicesListScreen';
import InvoiceDetailScreen from '../screens/clinic/InvoiceDetailScreen';
import CreateInvoiceScreen from '../screens/clinic/CreateInvoiceScreen';
import ReportsDashboardScreen from '../screens/clinic/ReportsDashboardScreen';
import TelehealthScreen from '../screens/clinic/TelehealthScreen';
import TelehealthCallScreen from '../screens/clinic/TelehealthCallScreen';

// Stock & Inventory
import StockListScreen from '../screens/clinic/StockListScreen';
import StockItemDetailScreen from '../screens/clinic/StockItemDetailScreen';
import CreateEditProductScreen from '../screens/clinic/CreateEditProductScreen';
import StockAdjustmentScreen from '../screens/clinic/StockAdjustmentScreen';
import StockHistoryScreen from '../screens/clinic/StockHistoryScreen';

// Suppliers
import SuppliersListScreen from '../screens/clinic/SuppliersListScreen';
import SupplierDetailScreen from '../screens/clinic/SupplierDetailScreen';
import CreateEditSupplierScreen from '../screens/clinic/CreateEditSupplierScreen';

// Finance
import PaymentsListScreen from '../screens/clinic/PaymentsListScreen';
import ExpensesListScreen from '../screens/clinic/ExpensesListScreen';
import CreateExpenseScreen from '../screens/clinic/CreateExpenseScreen';
import ExpenseDetailScreen from '../screens/clinic/ExpenseDetailScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const ChannelsStack = createNativeStackNavigator();
const ScheduleStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { name: 'HomeTab',     label: 'Home',     icon: 'home',           root: 'HomeMain' },
  { name: 'MessagesTab', label: 'Messages', icon: 'message-circle', root: 'ConversationsList' },
  { name: 'ChannelsTab', label: 'Channels', icon: 'hash',           root: 'ChannelsList' },
  { name: 'ScheduleTab', label: 'Schedule', icon: 'calendar',       root: 'ScheduleMain' },
  { name: 'MoreTab',     label: 'More',     icon: 'menu',           root: 'MoreMain' },
];

// ─── Floating pill tab bar ──────────────────────────────────────────────────────
function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const conversations = useQuery(api.messages.listConversations);
  const messageBadge = useMemo(() => {
    if (!conversations || !currentUserId) return 0;
    return conversations.filter(c =>
      Array.isArray(c.members) &&
      c.members.includes(currentUserId) &&
      c.unreadBy?.[currentUserId] === true
    ).length;
  }, [conversations, currentUserId]);
  
  // Hide tab bar on nested screens (e.g. Chat)
  const activeRoute = state.routes[state.index];
  const activeRouteName = getFocusedRouteNameFromRoute(activeRoute);
  
  const rootScreens = [
    'HomeMain', 'ConversationsList', 'ChannelsList', 'ScheduleMain', 'MoreMain', undefined
  ];
  if (!rootScreens.includes(activeRouteName)) return null;

  return (
    <View style={[barStyles.wrapper, { bottom: Math.max(28, insets.bottom + 12) }]} pointerEvents="box-none">
      <View style={barStyles.pill}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS[index];
          const badge = tab.name === 'MessagesTab' ? (messageBadge || 0) : (tab.badge || 0);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!event.defaultPrevented) {
              // Always navigate to the root screen of the tab so deep screens
              // from cross-tab navigation don't persist when switching tabs.
              navigation.navigate(route.name, tab.root ? { screen: tab.root } : undefined);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[barStyles.tabBtn, isFocused && barStyles.tabBtnActive]}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              {isFocused ? (
                /* Active: icon + label inside active pill */
                <View style={barStyles.activeContent}>
                  <Feather name={tab.icon} size={16} color={colors.white} />
                  <AppText variant="small" color={colors.white} style={barStyles.activeLabel}>
                    {tab.label}
                  </AppText>
                  {badge > 0 ? (
                    <View style={barStyles.activeBadge}>
                      <AppText style={barStyles.activeBadgeText}>{badge > 99 ? '99+' : badge}</AppText>
                    </View>
                  ) : null}
                </View>
              ) : (
                /* Inactive: icon only + optional dot badge */
                <View style={barStyles.inactiveContent}>
                  <Feather name={tab.icon} size={20} color={colors.mediumGrey} />
                  {badge > 0 ? <View style={barStyles.dot} /> : null}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 28 },
      android: { elevation: 14 },
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tabBtn: {
    flex: 0,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  tabBtnActive: {
    flex: 1,
    backgroundColor: colors.navyBlue,
    paddingHorizontal: 20,
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeBadge: {
    backgroundColor: colors.peach,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  activeBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  inactiveContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.peach,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});

// ─── Stack navigators ───────────────────────────────────────────────────────────
function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
    </HomeStack.Navigator>
  );
}

function MessagesStackScreen() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="ConversationsList" component={ConversationsScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
      <MessagesStack.Screen name="NewMessage" component={NewMessageScreen} options={{ presentation: 'modal' }} />
      <MessagesStack.Screen name="ChatInfo" component={ChatInfoScreen} />
      <MessagesStack.Screen name="NewGroup" component={NewGroupScreen} options={{ presentation: 'modal' }} />
    </MessagesStack.Navigator>
  );
}

function ChannelsStackScreen() {
  return (
    <ChannelsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChannelsStack.Screen name="ChannelsList" component={ChannelsScreen} />
      <ChannelsStack.Screen name="ChannelThread" component={ChannelThreadScreen} />
      <ChannelsStack.Screen name="ChannelInfo" component={ChannelInfoScreen} />
      <ChannelsStack.Screen name="DiscoverChannels" component={DiscoverChannelsScreen} />
      <ChannelsStack.Screen name="CreateChannel" component={CreateChannelScreen} />
    </ChannelsStack.Navigator>
  );
}

function ScheduleStackScreen() {
  return (
    <ScheduleStack.Navigator screenOptions={{ headerShown: false }}>
      <ScheduleStack.Screen name="ScheduleMain" component={ScheduleScreen} />
      <ScheduleStack.Screen name="EventDetail" component={EventDetailScreen} />
      <ScheduleStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ presentation: 'modal' }} />
      <ScheduleStack.Screen name="TrainingList" component={TrainingListScreen} />
    </ScheduleStack.Navigator>
  );
}

function MoreStackScreen() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="MoreMain" component={MoreScreen} />
      <MoreStack.Screen name="ClinicHub" component={ClinicHubScreen} />
      <MoreStack.Screen name="Profile" component={ProfileScreen} />
      <MoreStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MoreStack.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <MoreStack.Screen name="StaffDirectory" component={StaffDirectoryScreen} />
      <MoreStack.Screen name="StaffProfile" component={StaffProfileScreen} />
      <MoreStack.Screen name="Departments" component={DepartmentsScreen} />
      <MoreStack.Screen name="Files" component={FilesScreen} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
      <MoreStack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <MoreStack.Screen name="TrustedDevices" component={TrustedDevicesScreen} />
      <MoreStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <MoreStack.Screen name="About" component={AboutScreen} />
      <MoreStack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <MoreStack.Screen name="AdminDeviceApprovals" component={AdminDeviceApprovalsScreen} />
      <MoreStack.Screen name="AdminManageChannels" component={AdminManageChannelsScreen} />
      <MoreStack.Screen name="AdminSendAnnouncement" component={AdminSendAnnouncementScreen} />
      <MoreStack.Screen name="AdminSystemAnalytics" component={AdminSystemAnalyticsScreen} />
      <MoreStack.Screen name="AdminActivityLogs" component={AdminActivityLogsScreen} />
      <MoreStack.Screen name="AdminAddStaff" component={AdminAddStaffScreen} />
      <MoreStack.Screen name="AdminStaffCredentials" component={AdminStaffCredentialsScreen} />
      <MoreStack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
      <MoreStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <MoreStack.Screen name="BookAppointment" component={BookAppointmentScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="PatientDirectory" component={PatientDirectoryScreen} />
      <MoreStack.Screen name="PatientProfile" component={PatientProfileScreen} />
      <MoreStack.Screen name="AddEditPatient" component={AddEditPatientScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="TreatmentNote" component={TreatmentNoteScreen} />
      <MoreStack.Screen name="InvoicesList" component={InvoicesListScreen} />
      <MoreStack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <MoreStack.Screen name="CreateInvoice" component={CreateInvoiceScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="ReportsDashboard" component={ReportsDashboardScreen} />
      <MoreStack.Screen name="Telehealth" component={TelehealthScreen} />
      <MoreStack.Screen name="TelehealthCall" component={TelehealthCallScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      {/* Stock & Inventory */}
      <MoreStack.Screen name="StockList" component={StockListScreen} />
      <MoreStack.Screen name="StockItemDetail" component={StockItemDetailScreen} />
      <MoreStack.Screen name="CreateEditProduct" component={CreateEditProductScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="StockAdjustment" component={StockAdjustmentScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="StockHistory" component={StockHistoryScreen} />
      {/* Suppliers */}
      <MoreStack.Screen name="SuppliersList" component={SuppliersListScreen} />
      <MoreStack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <MoreStack.Screen name="CreateEditSupplier" component={CreateEditSupplierScreen} options={{ presentation: 'modal' }} />
      {/* Finance */}
      <MoreStack.Screen name="PaymentsList" component={PaymentsListScreen} />
      <MoreStack.Screen name="ExpensesList" component={ExpensesListScreen} />
      <MoreStack.Screen name="CreateExpense" component={CreateExpenseScreen} options={{ presentation: 'modal' }} />
      <MoreStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
    </MoreStack.Navigator>
  );
}

// ─── Tab navigator ──────────────────────────────────────────────────────────────
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeStackScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesStackScreen} />
      <Tab.Screen name="ChannelsTab" component={ChannelsStackScreen} />
      <Tab.Screen name="ScheduleTab" component={ScheduleStackScreen} />
      <Tab.Screen name="MoreTab" component={MoreStackScreen} />
    </Tab.Navigator>
  );
}
