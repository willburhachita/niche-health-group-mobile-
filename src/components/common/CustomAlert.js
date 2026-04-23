import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Modal, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { typography } from '../../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALERT_TYPES = {
  success: { icon: 'check-circle', color: colors.success, bg: '#E8F5EE' },
  error: { icon: 'alert-circle', color: colors.error, bg: '#FCE8E8' },
  warning: { icon: 'alert-triangle', color: colors.warning, bg: '#FDF3E8' },
  info: { icon: 'info', color: colors.navyBlue, bg: colors.navyLight },
  confirm: { icon: 'help-circle', color: colors.navyBlue, bg: colors.navyLight },
};

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({});
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const show = useCallback(({ type = 'info', title, message, buttons = [{ label: 'OK' }] }) => {
    setConfig({ type, title, message, buttons });
    setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dismiss = useCallback((onPress) => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      if (onPress) onPress();
    });
  }, []);

  const typeConfig = ALERT_TYPES[config.type] || ALERT_TYPES.info;

  return (
    <AlertContext.Provider value={show}>
      {children}
      <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <Pressable style={styles.overlayTouch} onPress={() => dismiss()} />
          <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: typeConfig.bg }]}>
              <Feather name={typeConfig.icon} size={28} color={typeConfig.color} />
            </View>

            {/* Title */}
            {config.title && (
              <AppText variant="h3" style={styles.title}>{config.title}</AppText>
            )}

            {/* Message */}
            {config.message && (
              <AppText variant="body" color={colors.darkGrey} style={styles.message}>
                {config.message}
              </AppText>
            )}

            {/* Buttons */}
            <View style={[styles.buttonRow, config.buttons?.length === 1 && styles.buttonRowSingle]}>
              {(config.buttons || []).map((btn, i) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';
                const isPrimary = !isDestructive && !isCancel && i === (config.buttons.length - 1);

                return (
                  <Pressable
                    key={i}
                    onPress={() => dismiss(btn.onPress)}
                    style={({ pressed }) => [
                      styles.button,
                      isPrimary && styles.buttonPrimary,
                      isDestructive && styles.buttonDestructive,
                      isCancel && styles.buttonCancel,
                      config.buttons.length > 1 && { flex: 1 },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <AppText
                      variant="bodyBold"
                      color={
                        isPrimary ? colors.white :
                        isDestructive ? colors.white :
                        colors.darkGrey
                      }
                    >
                      {btn.label || 'OK'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const show = useContext(AlertContext);
  if (!show) throw new Error('useAlert must be used within AlertProvider');
  return show;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - spacing.xl * 2, 340),
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.strong,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.offWhite,
  },
  buttonPrimary: {
    backgroundColor: colors.navyBlue,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonCancel: {
    backgroundColor: colors.offWhite,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
