# VeilBid — Video Recording Runbook

Tài liệu này dùng để **chuẩn bị và quay footage thô trước**. Chưa cần đọc lời
thoại khi quay; sau khi có đủ clip mới viết script và cắt bản cuối dưới 4 phút.

## 1. Quy tắc an toàn

- Chỉ Ethereum Sepolia.
- Địa chỉ `0x...` là public và có thể ghi trong tài liệu/video.
- Không ghi hoặc chụp private key, seed phrase, chữ ký, raw calldata, Nox
  handle, proof hay plaintext bid value.
- Khi nhập giá bid, crop/che ô giá hoặc chỉ giữ màn hình sau bước encrypt.
- Không dùng mock success. Nếu proof chậm, quay đúng trạng thái pending và
  Activity recovery.

## 2. Tài khoản cần chuẩn bị

Đây là bộ tài khoản cho một lifecycle quay mới với Safe và hai Vendor. Chỉ
import private key từ file local của bạn; **không copy private key vào Markdown**.

| Vai trò | Địa chỉ public cần dùng | Private key local | Dùng ở đâu |
| --- | --- | --- | --- |
| Safe owner / Buyer / review wallet | `0xE412d04DA2A211F7ADC80311CC0FF9F03440B64E` | `SEPOLIA_PRIVATE_KEY` | Kết nối trong `BUYER → SAFE BUYER`; ký Safe proposal. Review wallet được bind tự động, không nhập riêng. |
| Safe treasury | `0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0` | Không có private key riêng | Trong `SAFE BUYER`, chọn card Safe. Chỉ dán thủ công nếu Safe discovery không tìm thấy. |
| Vendor 1 | `0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55` | `SEPOLIA_TEST_VENDOR_PRIVATE_KEY` | Dán vào `APPROVED VENDORS → Vendor 1`; sau đó kết nối chính wallet này trong `PRIVATE BIDS`. |
| Vendor 2 | `0xA4565608e096CFEf7da36eB19a57Da6d277D942f` | `SEPOLIA_TEST_AUDITOR_PRIVATE_KEY` | Dán vào `APPROVED VENDORS → Vendor 2`; sau đó kết nối chính wallet này trong `PRIVATE BIDS`. |
| Permissionless finalizer | Một EOA Sepolia khác có ETH | Private key local của bạn | Không dán vào form. Chỉ kết nối wallet này khi dùng `ACTIVITY → MANUAL RELAY FALLBACK`. |

### Lưu ý về canonical release

Evidence lifecycle canonical cũ dùng Vendor thứ hai
`0x4d2809486012076B2212C829742BD95eF5992dB0`. Nếu bạn quay một tender mới,
dùng nhất quán Vendor 1 và Vendor 2 ở bảng trên; **không trộn** hai bộ địa chỉ.

## 3. Địa chỉ contract để kiểm tra (không nhập vào form)

Các địa chỉ này chỉ dùng để mở Etherscan hoặc đối chiếu UI:

| Thành phần | Địa chỉ |
| --- | --- |
| VeilBid Market | `0x720ac8Ae5dE78590FF5184E53130460033228afc` |
| Confidential vcUSDC wrapper | `0xE55b2f4630E9b1d48C7Fd8001527BA5dCD9192b1` |
| Test USDC faucet | `0xeE9A2B02C8700596b4814923c4086786c63A9D01` |
| Award receipt | `0x7B51DE3579F61741eDA8602D79AAD3f175451656` |
| Safe preparation module | `0x60a3ed162b13E7Fd8b0139547Aa1B38F41a774C0` |
| Per-Safe module factory | `0x6C09f72FF67eE0bfAD7D45DFFde5bd06228050BE` |

## 4. Copy/paste map trong app

### A. Safe Buyer

1. Kết nối `Safe owner / Buyer`.
2. Chọn card Safe có địa chỉ `0xBF39…3fbA0`.
3. Nếu không có card, mở ô `Safe address` / `CHECK SAFE` và dán:

   ```text
   0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0
   ```

4. Trong `CREATE A SAFE-OWNED TENDER → APPROVED VENDORS`, dán:

   **Vendor 1**

   ```text
   0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
   ```

   **Vendor 2**

   ```text
   0xA4565608e096CFEf7da36eB19a57Da6d277D942f
   ```

5. Không có ô nhập review wallet. App tự bind wallet owner đang kết nối
   (`0xE412…B64E`) làm review wallet khi Safe threshold approve tender.

### B. EOA Buyer (tuỳ chọn quay thêm)

1. Kết nối một EOA Buyer có Sepolia ETH và Test USDC.
2. Trong `EOA BUYER → APPROVED VENDORS`, dùng đúng hai địa chỉ Vendor ở trên,
   mỗi địa chỉ một row.
3. Review wallet cũng tự động là EOA Buyer đang kết nối; không dán địa chỉ
   review wallet.

### C. Private Bids

- Không dán địa chỉ vào `SUBMIT BID`.
- Kết nối Vendor 1 để gửi bid cho row Vendor 1.
- Đổi sang Vendor 2 để gửi bid cho row Vendor 2.
- Tender chỉ xuất hiện nếu wallet hiện tại đúng allowlist và tender còn `Open`.

### D. Public, Activity và review

- `PUBLIC`: không cần wallet, không dán địa chỉ.
- `ACTIVITY`: không cần dán địa chỉ; nếu dùng manual fallback thì kết nối
  permissionless finalizer có ETH.
- `GRANTED ACCESS`: kết nối đúng review wallet `0xE412…B64E` sau khi tender
  finalized; ACL được cấp tự động, không có thao tác grant thủ công.

### E. Safe unwrap

`PUBLIC vUSDC RECIPIENT` tự khóa thành địa chỉ EOA đang kết nối. Không dán Safe
address hoặc recipient khác vào đây.

## 5. Chuẩn bị số dư và dữ liệu

- Mỗi wallet ký giao dịch phải có Sepolia ETH.
- Safe `0xBF39…3fbA0` phải có đủ confidential vcUSDC cho public ceiling.
- Nếu cần, dùng `GET TEST USDC` rồi `DEPOSIT TO SAFE` trong `SAFE BUYER`.
- Dùng dữ liệu ngắn, ví dụ:
  - Public metadata: `Website development tender`
  - Public ceiling: `10`
  - Deadline: hiện tại + 10–15 phút
- Hai bid mẫu có thể là `8` và `7`, nhưng phải che giá trong footage công khai.
- Kiểm tra production app và relay trước khi quay:

  ```text
  https://veilbid-three.vercel.app
  https://veilbid-relay-production.up.railway.app/health
  ```

## 6. Thứ tự quay footage thô

1. `01-public`: Public explorer khi chưa kết nối wallet.
2. `02-safe-select`: kết nối owner, chọn Safe hoặc dán Safe address fallback.
3. `03-safe-funding`: reveal/fund vcUSDC cho Safe; giữ plaintext ngoài vùng quay.
4. `04-safe-create`: nhập metadata, ceiling, deadline và hai approved vendors;
   tạo Safe batch, approve/execute, rồi confirm exact funding.
5. `05-vendor-1`: Vendor 1 encrypt và submit bid.
6. `06-vendor-2`: Vendor 2 encrypt và submit bid.
7. `07-close-finalize`: relay hoặc Activity close, public proof và finalize.
8. `08-award-review`: winner public, receipt, review wallet có ACL sau finalize.
9. `09-safe-exit`: optional full/custom unwrap và Activity lifecycle history.
10. `10-recovery`: optional pending proof hoặc manual recovery thật, không giả lập.

Mỗi clip nên giữ màn hình ổn định 2–3 giây sau khi trạng thái chuyển thành
`confirmed`, `Open`, `Closed` hoặc `Awarded`. Sau khi đủ clip, mới viết voiceover
và cắt bản submission tối đa 4 phút.

## 7. Checklist trước khi bấm Record

- [ ] Đang ở Ethereum Sepolia.
- [ ] Đã tắt notification và mở browser sạch.
- [ ] Đã chuẩn bị 4–5 wallet session, không lộ private key.
- [ ] Safe owner đúng `0xE412…B64E`.
- [ ] Safe đúng `0xBF39…3fbA0`.
- [ ] Hai Vendor trong form đúng thứ tự và đúng checksum.
- [ ] Safe đủ vcUSDC; Buyer/Vendor/finalizer đủ gas.
- [ ] Deadline còn đủ thời gian cho funding proof và hai bid.
- [ ] Không có handle, proof, calldata hoặc plaintext bid trong vùng quay.
- [ ] Đã chuẩn bị một tender backup/proof-ready và Activity recovery path.
