// Fictitious emails for the Unanswered Emails room. Every sender, address and company here is made up.
const rnd = a => a[Math.floor(Math.random() * a.length)];
export const TEMPLATES = [
  { from: "Brenda (Facilities)", addr: "brenda.facilities@nowhere-in-particular.test", subject: "Re: Re: Re: Fwd: The kettle", color: "#d9822b",
    body: ["Hi all,", "Following up on my previous three follow-ups regarding the kettle on floor 4. It is now being referred to as \"the situation\".", "Please do not descale it. Please do not ask me what happens if you descale it.", "Kind regards,"], sig: "Brenda", attach: null },
  { from: "Dave from Accounts", addr: "dave.a@ledger-adjacent.test", subject: "Quick question (not quick)", color: "#3b7ea1",
    body: ["Hi,", "Do you have a minute to look at a spreadsheet? It is 41 tabs. The question is on tab 38, and it is \"why is tab 12 blue\".", "No rush. Rush would be fine though.", "Thanks,"], sig: "Dave", attach: "budget_FINAL_v7_REAL_use-this-one.xlsx" },
  { from: "The Moon (Unfinished)", addr: "backside@moon.test", subject: "Re: Back of the moon: are you still coming?", color: "#5b5ea6",
    body: ["Hello,", "We are still setting up the back. The front is lovely, thank you for asking. Please bring a torch and, if possible, a second half.", "See you soon (ish),"], sig: "The Moon", attach: null },
  { from: "People & Culture", addr: "fun@mandatory-joy.test", subject: "Reminder: your RSVP to Mandatory Fun is overdue", color: "#c04a63",
    body: ["Hi team!", "This is a friendly reminder that Mandatory Fun is mandatory. Attendance is tracked, and so is enthusiasm.", "Please reply with your preferred flavour of fun by end of day yesterday.", "Warmly,"], sig: "People & Culture", attach: null },
  { from: "Mom", addr: "mom@home.test", subject: "Did you eat?", color: "#2f8f6d",
    body: ["Sweetheart,", "Did you eat? Not a snack, I mean actual food. Also your cousin got a new job and a new car and a new everything. Anyway, did you eat?", "Call me when you see this. Or text. Or just eat.", "Love,"], sig: "Mom", attach: null },
  { from: "Pigeon Council", addr: "secretary@pigeon-meetings.test", subject: "Minutes of the last meeting", color: "#6b7f99",
    body: ["Dear member,", "Please find attached the minutes. Present: 8. Absent: bread. Motion to acquire bread: carried, then dropped.", "Next meeting: same place, same time, same crumbs (pending).", "Coo,"], sig: "The Secretary (a pigeon)", attach: "minutes.txt (coo coo coo)" },
  { from: "IT Support", addr: "helpdesk@have-you-tried.test", subject: "Re: Have you tried turning your inbox off and on again?", color: "#4a4a4a",
    body: ["Hello,", "We have closed your ticket as \"resolved\" because you did not reply within 5 minutes. Please open a new ticket to reopen your resolved ticket.", "Regards,"], sig: "IT Support (ticket #000000)", attach: null },
  { from: "Sock Registry", addr: "lost@socks.test", subject: "Update: your missing sock has been located", color: "#b0517f",
    body: ["Hi,", "Good news: a sock has been located. Bad news: it is not yours. Your sock has requested to remain missing.", "Please do not attempt to reunite the pair. It creates paperwork.", "Sincerely,"], sig: "Sock Registry", attach: null },
  { from: "Auto-Reply", addr: "noreply@out-of-office.test", subject: "Automatic reply: Out of office", color: "#8a8a86",
    body: ["Thank you for your email.", "I am out of the office with no access to email. I have been out of the office since 2019. I will respond when I return.", "If your matter is urgent, please email me."], sig: "", attach: null },
  { from: "Gary", addr: "gary@per-my-last.test", subject: "Per my last email", color: "#7a5230",
    body: ["Hi,", "Per my last email (see below, and below that, and the one below that), could you please advise?", "I have copied everyone I have ever met.", "Best,"], sig: "Gary", attach: null },
  { from: "Newsletter Weekly", addr: "digest@newsletters-about-newsletters.test", subject: "You have 99+ unread newsletters about newsletters", color: "#d1a31f",
    body: ["Hey there,", "This week in newsletters: a newsletter about our newsletter, a survey about the survey, and a thoughtful piece on unsubscribing (you can't).", "Unsubscribe (takes up to 10 business years)."], sig: "", attach: null },
  // ---- school friends
  { from: "Jake (Homeroom 4)", addr: "jake.backrow@oldschool-friends.test", subject: "DUDE. 10 year reunion. you HAVE to come", color: "#2f7d5b",
    body: ["Dude,", "Ten years since graduation!! Everyone is coming. Even Brandon, who swore he would never come, who is now coming, and bringing his fiancée, who none of us have ever met.", "Reply fast, I need a headcount. I have asked you 4 times in the group chat too. Don't ghost me.", "Your oldest friend,"], sig: "Jake", attach: null },
  { from: "Emily", addr: "emily.k@oldschool-friends.test", subject: "OMG do you remember Mr. Henderson's algebra class???", color: "#c2527a",
    body: ["Heyyyy!!!", "I was cleaning out my closet and found my algebra notebook. On the last page it says 'EMILY + [REDACTED] forever'. I will not tell you who. (It is you. Kidding. It is not.)", "Also found your doodle of Mr. Henderson as a potato. It has survived. We should frame it.", "Miss you! Call me!!"], sig: "Emily xx", attach: "algebra_notebook_last_page.jpg" },
  { from: "Mike", addr: "mike.r@oldschool-friends.test", subject: "Why did you leave the class group chat", color: "#3b6fb0",
    body: ["Hey man,", "I saw you left 'Class of 2013 FOREVER'. 212 members. 3,400 unread messages. Nobody has posted anything except good morning memes since 2018.", "Please come back. The group chat feels lonely without your thumbs up.", "Regards,"], sig: "Mike", attach: null },
  { from: "Sarah", addr: "sarah.m@oldschool-friends.test", subject: "Prom photos (finally!!)", color: "#8e5bb5",
    body: ["Hi guys!!", "I have finally scanned the prom photos. In one of them you are looking at the camera. In the other 39 you are mid-blink. Truly a gift.", "Folder attached. Please tag yourselves. Please do not tag me. I look like that because of the flash."], sig: "Sarah", attach: "prom_2013_DSC0012_to_DSC0051.zip" },
  { from: "Tom", addr: "tom.p@oldschool-friends.test", subject: "Can you send the physics notes (junior year)?", color: "#d1792b",
    body: ["Hey,", "Random request, I know. Do you still have the physics notes from junior year? The ones with the doodles. My kid has a test tomorrow and I do not remember anything past 'F = ma'.", "I will owe you one. Actually I already owe you three. I will owe you four."], sig: "Tom", attach: null },
  { from: "Reunion Committee", addr: "committee@oldschool-friends.test", subject: "Re: Re: Re: Reunion venue (the pizza debate, part 6)", color: "#7a7a2b",
    body: ["Dear all,", "After 112 messages the committee has decided that the venue is: to be decided. Team Pizza Place and Team Hotel Ballroom have agreed to disagree and also to stop speaking.", "Please vote by replying 'Pizza' or 'Ballroom'. Replies of 'Whatever' will be counted as 'Pizza'.", "Regards,"], sig: "Committee (3 members, 2 not talking)", attach: null },
  // ---- astrologers
  { from: "Madame Celeste (Astrologer)", addr: "celeste@cosmic-remedies.test", subject: "URGENT: Your Saturn Return is ending (remedy required)", color: "#b3541e",
    body: ["Dear friend,", "I have looked at your chart again. Good news: your Saturn Return ends in 3 months. Bad news: Mars is peeking into your 7th house and he looks unhappy.", "A small remedy will fix everything. It is only a few hundred dollars plus a black candle. Please reply today, the stars will not wait.", "Blessings,"], sig: "Madame Celeste", attach: "your_birth_chart_FINAL.pdf" },
  { from: "Madame Zora", addr: "zora@mystic-inbox.test", subject: "I foresaw you would not open this email", color: "#6b3fa0",
    body: ["Dear seeker,", "I foresaw you would not open this email. I was right. I see you opening it now, though, so I was also wrong. This is what we call a paradox, and also a fee.", "Your destiny is waiting for you at 1 PM, near a tree, or possibly a bus stop.", "With cosmic regards,"], sig: "Madame Zora", attach: null },
  { from: "Daily Horoscope", addr: "stars@horoscope-digest.test", subject: "Your horoscope: Mercury is in retrograde (so is your inbox)", color: "#2a6f97",
    body: ["Good morning, dear one!", "Today Mercury is in retrograde. Do not sign contracts, send texts, start projects, or trust anyone who says 'quick call'. Lucky number: 7. Lucky colour: whatever is clean.", "Your love life: a surprise is coming. Possibly a courier. Possibly another courier."], sig: "", attach: null },
  { from: "Stella the Star Reader", addr: "stella@astro-offers.test", subject: "Special Full Moon Ritual offer: only 3 slots left (still)", color: "#c9771a",
    body: ["Dear star child,", "Only 3 slots left for the Grand Planetary Peace Ritual. This is the same 3 slots as last month. The planets move, but my slots stay.", "Book now and get a free lucky crystal, which will arrive in 6 to 8 business years.", "Stay starry,"], sig: "Stella", attach: "ritual_price_list_2019.pdf" },
  { from: "Cosmic Insights", addr: "chart@cosmic-insights.test", subject: "Your birth chart has been waiting for you", color: "#3d5a80",
    body: ["Hello,", "Your birth chart has been waiting patiently for you to open it since you entered your date of birth at 2 AM in 2020. It says you are 'a deep person who sometimes forgets to reply to emails'. It is very accurate.", "Click here to unlock the other 11 houses ($4.99 each)."], sig: "", attach: null },
  { from: "Aunt Linda (Feng shui consultant)", addr: "linda.fengshui@homeharmony.test", subject: "Re: your living room (the couch must face the door)", color: "#a64b5f",
    body: ["Sweetheart,", "I have thought about your apartment. The couch is facing the wrong way and this is the reason for everything. Also move the plant by 2 inches. Not 3. I will know.", "Do this and your emails will start getting replies. I have seen it happen. Twice."], sig: "Aunt Linda", attach: null },
  { from: "Calendar", addr: "invites@meeting-about-meetings.test", subject: "Invitation: Meeting to schedule a meeting", color: "#3f6fd0",
    body: ["You have been invited to a meeting.", "What: Meeting to schedule a meeting", "When: Whenever everyone is free (never)", "Where: Room 4, which does not exist"], sig: "", attach: null }
];
export const DATES = ["Tue, Mar 3, 2020, 9:41 AM", "Mon, Nov 18, 2019, 4:12 PM", "Fri, Jul 9, 2021, 11:03 AM", "Thu, Jan 2, 2020, 8:00 AM", "Sun, Sep 26, 2021, 10:27 PM", "Wed, Feb 14, 2018, 3:30 PM"];
export const AGO = ["3 years ago", "4 years ago", "2 years ago", "5 years ago", "6 years ago", "7 years ago"];

/** A random fictitious email as plain data. */
export function makeEmail() {
  const t = rnd(TEMPLATES), i = Math.floor(Math.random() * DATES.length);
  return { ...t, date: DATES[i], ago: AGO[i], initial: t.from.replace(/[^A-Za-z]/g, "").charAt(0).toUpperCase() };
}
