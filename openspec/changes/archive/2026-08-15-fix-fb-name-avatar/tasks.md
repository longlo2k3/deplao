# Tasks: fix-fb-name-avatar

## 1. Expose participants trong parseThreadNodes

- [x] File: `src/services/facebook/FacebookThreadManager.ts` (104-171)
- [x] Acceptance: output thread kÃ¨m `participants: {id, name, avatarUrl}[]` tá»« all_participants.edges
- [x] Test: script electron â€” group "Fan anh Äá»™ Mixi" 9 participants tÃªn/avatar Ä‘Ãºng

## 2. Persist participants â†’ contacts + group members

- [x] File: `src/services/facebook/FacebookService.ts` (persistThreadParticipants sau getThreadList)
- [x] Acceptance:
  - [x] Upsert contacts owner=fbId numeric, ON CONFLICT khÃ´ng ghi Ä‘Ã¨ tÃªn báº±ng rá»—ng
  - [x] Group thread â†’ saveGroupMembers(fbId, threadId, members)
- [x] Test: contacts owner=facebook_id=232 rows; page_group_member=9 rows cho group

## 3. UI: FB group members vÃ o cache

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (1126, 1195)
- [x] Acceptance: má»Ÿ group FB â†’ buildAndSetGroupInfo tá»« page_group_member (owner fbId); bubble hiá»ƒn thá»‹ displayName thay UID
- [x] Test: chá» user test UI "Fan anh Äá»™ Mixi"/"Box NRO"

## 4. IPC owner key = facebook_id

- [x] File: `electron/ipc/facebookIpc.ts` (383-414)
- [x] Acceptance: INSERT/UPDATE contacts dÃ¹ng owner = acc.facebook_id (khÃ´ng pháº£i UUID)
- [x] Test: grep + code review â€” dÃ¹ng fbAcc.facebook_id

## 5. Owner filter chá»‘ng cross-contamination

- [x] Files: `FacebookService.ts` (551, 657, 770, 1625), `DatabaseService.ts` (7956)
- [x] Acceptance: má»i contact lookup/update cá»§a FB cÃ³ `AND owner_zalo_id = ?`
- [x] Test: grep â€” khÃ´ng cÃ²n query contacts thiáº¿u owner trong FB paths

## 6. Scraper og:title + avatar order + guard rÃ¡c

- [x] File: `src/services/facebook/FacebookSession.ts` (225-293)
- [x] Acceptance: name Æ°u tiÃªn og:title (strip suffix); avatar thá»© tá»± 168px â†’ profile_pic_uri â†’ CDN â†’ mbasic â†’ scontent cuá»‘i; guard tÃªn rÃ¡c ("Xem thÃªm"/"Show more"/"Error"/digits)
- [x] Test: script electron â€” name="HTool Viá»‡t Nam" khá»›p thread name (láº§n trÆ°á»›c tráº£ "Xem thÃªm")

## 7. Enrichment UI: finally clear + Ä‘Ãºng owner

- [x] File: `src/ui/components/chat/ChatWindow.tsx` (1361-1402)
- [x] Acceptance: requestedMemberInfoRef delete trong finally; updateContactProfile dÃ¹ng acc.facebook_id
- [x] Test: code review + chá» user test

## 8. E2EE senderId=0 guard

- [x] File: `src/services/facebook/FacebookService.ts` (1373, 547, 683)
- [x] Acceptance: senderID=0 â†’ userID='' â†’ khÃ´ng fetch profile "0"
- [x] Test: code review (khÃ´ng Ä‘á»•i Go bridge â€” chá»‰ TS guard)

## 9. Verify toÃ n diá»‡n + archive

- [x] `tsc -p tsconfig.electron.json` 0 lá»—i
- [x] Cháº¡y script electron tá»•ng há»£p (participants persist, scraper, contact owner) â€” PASS
- [x] Test UI: group FB hiá»‡n tÃªn Ä‘Ãºng; 1-1 tÃªn/avatar Ä‘Ãºng; khÃ´ng contamination 2 account
- [x] `openspec archive fix-fb-name-avatar` + update checkbox
