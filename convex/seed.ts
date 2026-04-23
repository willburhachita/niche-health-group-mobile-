import { mutation } from "./_generated/server";

// Run once to populate the database with initial data.
// Call via dashboard: npx convex run seed:seedAll
export const seedAll = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    // ── Check if already seeded ──────────────────────────────────────
    const existing = await ctx.db.query("staffAccounts").first();
    if (existing) {
      return "Database already seeded. Skipping.";
    }

    // ── Staff Accounts ───────────────────────────────────────────────
    await ctx.db.insert("staffAccounts", {
      userId: "user-005", email: "wilburhachita@gmail.com", phone: null,
      title: null, displayName: null, fullName: null, role: "admin",
      password: "Michelle13//.", verificationCode: "123456",
      isActive: true, isOnboarded: false,
      trustedDevices: ["device-emulator-001"],
      createdBy: "system", createdAt: 1678886400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-001", email: "sarah.mbewe@nichehealthcare.co.uk", phone: "+260971234501",
      title: "Dr", displayName: "Dr. Mbewe S.", fullName: "Mbewe Sarah", role: "doctor",
      password: "Doctor123!", verificationCode: "234567",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-001"],
      createdBy: "system", createdAt: now - 90 * 86400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-002", email: "james.phiri@nichehealthcare.co.uk", phone: "+260971234502",
      title: "Nurse", displayName: "Nurse Phiri J.", fullName: "Phiri James", role: "nurse",
      password: "Nurse123!", verificationCode: "345678",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-002"],
      createdBy: "system", createdAt: now - 120 * 86400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-003", email: "chisanga.banda@nichehealthcare.co.uk", phone: "+260971234503",
      title: "Dr", displayName: "Dr. Banda C.", fullName: "Banda Chisanga", role: "doctor",
      password: "Doctor456!", verificationCode: "456789",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-003"],
      createdBy: "system", createdAt: now - 200 * 86400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-004", email: "grace.mutale@nichehealthcare.co.uk", phone: "+260971234504",
      title: "Pharmacist", displayName: "Pharmacist Mutale G.", fullName: "Mutale Grace", role: "pharmacist",
      password: "Pharma123!", verificationCode: "567890",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-004"],
      createdBy: "system", createdAt: now - 150 * 86400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-006", email: "david.tembo@nichehealthcare.co.uk", phone: "+260971234506",
      title: "Nurse", displayName: "Nurse Tembo D.", fullName: "Tembo David", role: "nurse",
      password: "Nurse456!", verificationCode: "678901",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-006"],
      createdBy: "system", createdAt: now - 100 * 86400000,
    });
    await ctx.db.insert("staffAccounts", {
      userId: "user-007", email: "ruth.chomba@nichehealthcare.co.uk", phone: "+260971234507",
      title: "Nurse", displayName: "Nurse Chomba R.", fullName: "Chomba Ruth", role: "nurse",
      password: "Nurse789!", verificationCode: "789012",
      isActive: true, isOnboarded: true,
      trustedDevices: ["device-007"],
      createdBy: "system", createdAt: now - 80 * 86400000,
    });

    // ── Users (profile/display) ──────────────────────────────────────
    const usersData = [
      { externalId: "user-001", displayName: "Dr. Sarah Mbewe", firstName: "Sarah", lastName: "Mbewe", initials: "SM", userType: "staff", staffRole: "doctor", department: "Dialysis", email: "sarah.mbewe@nichehealthcare.co.uk", phone: "+260971234501", onlineStatus: "online", joinedAt: now - 90 * 86400000, bio: "Specialist in renal dialysis. 12 years experience in nephrology care." },
      { externalId: "user-002", displayName: "Nurse James Phiri", firstName: "James", lastName: "Phiri", initials: "JP", userType: "staff", staffRole: "nurse", department: "Dialysis", email: "james.phiri@nichehealthcare.co.uk", phone: "+260971234502", onlineStatus: "online", joinedAt: now - 120 * 86400000, bio: "Senior Dialysis Nurse. Certified in peritoneal and haemodialysis." },
      { externalId: "user-003", displayName: "Dr. Chisanga Banda", firstName: "Chisanga", lastName: "Banda", initials: "CB", userType: "staff", staffRole: "doctor", department: "General Medicine", email: "chisanga.banda@nichehealthcare.co.uk", phone: "+260971234503", onlineStatus: "offline", lastSeenAt: now - 7200000, joinedAt: now - 200 * 86400000, bio: "General Medicine consultant with focus on internal medicine." },
      { externalId: "user-004", displayName: "Pharmacist Grace Mutale", firstName: "Grace", lastName: "Mutale", initials: "GM", userType: "staff", staffRole: "pharmacist", department: "Pharmacy", email: "grace.mutale@nichehealthcare.co.uk", phone: "+260971234504", onlineStatus: "away", joinedAt: now - 150 * 86400000, bio: "Lead Pharmacist. Manages all medication dispensing and stock control." },
      { externalId: "user-005", displayName: "Dr. Yusuf Patel", firstName: "Yusuf", lastName: "Patel", initials: "YP", userType: "staff", staffRole: "admin", department: "Administration", email: "yusuf.patel@nichehealthcare.co.uk", phone: "+260971234505", onlineStatus: "online", joinedAt: now - 365 * 86400000, bio: "Chief Administrator and founding member of Niche Healthcare." },
      { externalId: "user-006", displayName: "Nurse David Tembo", firstName: "David", lastName: "Tembo", initials: "DT", userType: "staff", staffRole: "nurse", department: "Night Shift", email: "david.tembo@nichehealthcare.co.uk", phone: "+260971234506", onlineStatus: "offline", lastSeenAt: now - 28800000, joinedAt: now - 100 * 86400000, bio: "Night shift lead nurse. Experienced in emergency care." },
      { externalId: "user-007", displayName: "Nurse Ruth Chomba", firstName: "Ruth", lastName: "Chomba", initials: "RC", userType: "staff", staffRole: "nurse", department: "ICU", email: "ruth.chomba@nichehealthcare.co.uk", phone: "+260971234507", onlineStatus: "offline", lastSeenAt: now - 3600000, joinedAt: now - 80 * 86400000, bio: "ICU specialist nurse. Advanced Life Support certified." },
    ];
    for (const u of usersData) {
      await ctx.db.insert("users", u);
    }

    // ── Conversations ────────────────────────────────────────────────
    const conv1 = await ctx.db.insert("conversations", { type: "direct", members: ["user-001", "user-002"], lastMessage: "Patient in Bay 3 needs review", lastMessageBy: "user-002", lastMessageAt: now - 120000, unreadCount: 2 });
    const conv2 = await ctx.db.insert("conversations", { type: "direct", members: ["user-001", "user-003"], lastMessage: "Thanks, I'll check the results", lastMessageBy: "user-003", lastMessageAt: now - 900000, unreadCount: 0 });
    const conv3 = await ctx.db.insert("conversations", { type: "group", name: "Pharmacy Team", members: ["user-001", "user-004", "user-002", "user-006"], lastMessage: "Dr. Mbewe: New stock arrived", lastMessageBy: "user-001", lastMessageAt: now - 3600000, unreadCount: 5 });
    const conv4 = await ctx.db.insert("conversations", { type: "direct", members: ["user-001", "user-005"], lastMessage: "Your device has been approved", lastMessageBy: "user-005", lastMessageAt: now - 10800000, unreadCount: 0 });

    // ── Messages ─────────────────────────────────────────────────────
    const msgs = [
      { conversationId: conv1, senderId: "user-002", content: "Good morning Dr. Mbewe, patient in Bay 3 is showing elevated BP readings since 6am", sentAt: now - 7200000, type: "text" },
      { conversationId: conv1, senderId: "user-002", content: "Current reading is 165/95. Patient is on their regular dialysis session.", sentAt: now - 7190000, type: "text" },
      { conversationId: conv1, senderId: "user-001", content: "Thanks James. Has the patient reported any symptoms? Headache or dizziness?", sentAt: now - 7020000, type: "text" },
      { conversationId: conv1, senderId: "user-002", content: "No headache, slight dizziness when standing. Fluid intake has been normal.", sentAt: now - 6960000, type: "text" },
      { conversationId: conv1, senderId: "user-001", content: "OK. Let's reduce the UF rate by 200ml/hr and recheck in 30 mins. I'll come by after my 11am.", sentAt: now - 6840000, type: "text" },
      { conversationId: conv1, senderId: "user-002", content: "Noted. Will adjust and monitor. Thank you Doctor.", sentAt: now - 6780000, type: "text" },
      { conversationId: conv1, senderId: "user-002", content: "Patient in Bay 3 needs review", sentAt: now - 120000, type: "text" },
      { conversationId: conv2, senderId: "user-001", content: "Hi Dr. Banda, could you check the lab results for patient in Bay 1?", sentAt: now - 3600000, type: "text" },
      { conversationId: conv2, senderId: "user-003", content: "Sure, I'll pull them up now.", sentAt: now - 3300000, type: "text" },
      { conversationId: conv2, senderId: "user-003", content: "Results look normal. Creatinine is within range.", sentAt: now - 2700000, type: "text" },
      { conversationId: conv2, senderId: "user-001", content: "Great, thanks for checking.", sentAt: now - 1800000, type: "text" },
      { conversationId: conv3, senderId: "user-001", content: "Morning team. Do we have sufficient Heparin stock for the week?", sentAt: now - 7200000, type: "text" },
      { conversationId: conv3, senderId: "user-004", content: "Good morning. Yes, we received the new shipment yesterday. Current stock: 450 units.", sentAt: now - 6900000, type: "text" },
      { conversationId: conv3, senderId: "user-006", content: "Great news. Bay 2 was running low yesterday.", sentAt: now - 6780000, type: "text" },
      { conversationId: conv4, senderId: "user-005", content: "Your new device has been approved. You can now access the full app.", sentAt: now - 10800000, type: "text" },
      { conversationId: conv4, senderId: "user-001", content: "Thank you Dr. Patel!", sentAt: now - 10700000, type: "text" },
    ];
    for (const m of msgs) {
      await ctx.db.insert("messages", m);
    }

    // ── Channels ─────────────────────────────────────────────────────
    const ch1 = await ctx.db.insert("channels", { name: "dialysis-team", displayName: "Dialysis Team", description: "Dialysis team coordination and updates", type: "public", members: ["user-001","user-002","user-003","user-006","user-007"], admins: ["user-001"], unreadCount: 3, isStarred: true, memberCount: 12 });
    await ctx.db.insert("channels", { name: "announcements", displayName: "Announcements", description: "Official announcements from admin", type: "public", members: ["user-001","user-002","user-003","user-004","user-005","user-006","user-007"], admins: ["user-005"], unreadCount: 1, isStarred: true, memberCount: 24 });
    await ctx.db.insert("channels", { name: "general", displayName: "General", description: "General discussions for all staff", type: "public", members: ["user-001","user-002","user-003","user-004","user-005","user-006","user-007"], admins: ["user-005"], unreadCount: 0, isStarred: false, memberCount: 24 });
    await ctx.db.insert("channels", { name: "pharmacy", displayName: "Pharmacy", description: "Pharmacy stock updates and requests", type: "public", members: ["user-001","user-004","user-002"], admins: ["user-004"], unreadCount: 5, isStarred: false, memberCount: 8 });

    // ── Channel Messages ─────────────────────────────────────────────
    const chMsgs = [
      { channelId: ch1, senderId: "user-003", content: "Morning team. Bay allocations for today:\nBay 1: 6 patients (Dr. Banda)\nBay 2: 5 patients (Dr. Mbewe)\nBay 3: 4 patients (Dr. Patel)", sentAt: now - 14400000, type: "text" },
      { channelId: ch1, senderId: "user-002", content: "Confirmed. Bay 2 is prepped. Machines 4 and 5 had maintenance yesterday - both cleared.", sentAt: now - 14100000, type: "text" },
      { channelId: ch1, senderId: "user-001", content: "Thanks James. Please double-check water quality readings before we start.", sentAt: now - 13800000, type: "text" },
      { channelId: ch1, senderId: "user-002", content: "Water quality checked. All readings within normal range.\nConductivity: 14.2, Temperature: 37.1C", sentAt: now - 13680000, type: "text" },
      { channelId: ch1, senderId: "user-005", content: "Reminder: Monthly clinical audit is scheduled for Friday 28th March. All bay leads please submit reports by Thursday.", sentAt: now - 12600000, type: "text", isPinned: true },
    ];
    for (const m of chMsgs) {
      await ctx.db.insert("channelMessages", m);
    }

    // ── Files ────────────────────────────────────────────────────────
    await ctx.db.insert("files", { name: "Standard Operating Procedures", fileType: "folder", itemCount: 12 });
    await ctx.db.insert("files", { name: "Training Materials", fileType: "folder", itemCount: 8 });
    await ctx.db.insert("files", { name: "Policies & Guidelines", fileType: "folder", itemCount: 5 });
    await ctx.db.insert("files", { name: "Shift_Rota_March_2026.xlsx", fileType: "xlsx", size: 250880, uploadedBy: "user-005", uploadedAt: now - 259200000 });
    await ctx.db.insert("files", { name: "Dialysis_Protocol_v3.2.pdf", fileType: "pdf", size: 1887436, uploadedBy: "user-003", uploadedAt: now - 604800000 });
    await ctx.db.insert("files", { name: "Infection_Control_Guide.pdf", fileType: "pdf", size: 3355443, uploadedBy: "user-005", uploadedAt: now - 1209600000 });

    // ── Announcements ────────────────────────────────────────────────
    await ctx.db.insert("announcements", {
      title: "Updated SOPs for Q1 2026",
      body: "All staff are advised that the Standard Operating Procedures for dialysis treatment have been updated.",
      author: "user-005",
      acknowledgedBy: ["user-001", "user-002", "user-003"],
      totalStaff: 24,
      createdAt: now - 7200000,
    });

    return "Database seeded successfully!";
  },
});
