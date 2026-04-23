import React from 'react';
import { Text } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

/**
 * Renders message content with @mentions highlighted.
 *
 * Parses the content for @handle tokens. Handles are matched against the provided
 * `userMap` (a Record of externalId -> user) by comparing with each user's
 * firstName / lastName / displayName (case-insensitive, with spaces stripped).
 *
 * Mentions that reference `currentUserId` get a stronger highlight color.
 */
export const MentionText = ({
  content,
  userMap = {},
  mentions,
  currentUserId,
  isOwn = false,
  style,
}) => {
  if (!content) return null;

  const textColor = isOwn ? colors.white : colors.black;

  // Build a lookup of handle -> user for fast matching
  const handleToUser = React.useMemo(() => {
    const map = {};
    for (const id of Object.keys(userMap)) {
      const u = userMap[id];
      if (!u) continue;
      const candidates = new Set();
      if (u.firstName) candidates.add(u.firstName);
      if (u.lastName) candidates.add(u.lastName);
      if (u.displayName) {
        // Use last word of displayName (e.g. "Dr. Mbewe S." -> "Mbewe")
        const parts = u.displayName.split(/[\s.]+/).filter(Boolean);
        if (parts.length) candidates.add(parts[parts.length - 1]);
        candidates.add(u.displayName.replace(/\s+/g, ''));
      }
      for (const handle of candidates) {
        map[handle.toLowerCase()] = u;
      }
    }
    return map;
  }, [userMap]);

  // Tokenize: split by @word but keep delimiters
  const tokens = content.split(/(@[\w.]+)/g);

  return (
    <Text style={[typography.body, { color: textColor }, style]}>
      {tokens.map((tok, i) => {
        if (!tok.startsWith('@')) return tok;
        const handle = tok.slice(1).toLowerCase();
        const user = handleToUser[handle];
        if (!user) return tok;
        const isCurrent = user.externalId === currentUserId;
        const color = isOwn
          ? colors.white
          : isCurrent
          ? colors.peach
          : colors.navyBlue;
        return (
          <Text
            key={i}
            style={{
              color,
              fontWeight: '700',
              backgroundColor: isCurrent && !isOwn ? colors.peachLight : 'transparent',
            }}
          >
            {tok}
          </Text>
        );
      })}
    </Text>
  );
};
