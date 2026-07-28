# VeilBid — Hướng dẫn quay video

Tài liệu này đi theo đúng thứ tự quay: **Landing → Docs → EOA Buyer hoàn chỉnh
→ Safe Buyer làm lại từ đầu**. Chỉ cần chuẩn bị ba ví Sepolia.

Web production:

```text
https://veilbid-three.vercel.app
```

## 1. Chuẩn bị đúng ba ví

| Ví | Vai trò | Địa chỉ |
| --- | --- | --- |
| Ví 1 | EOA Buyer, Safe owner và review wallet | `0xE412d04DA2A211F7ADC80311CC0FF9F03440B64E` |
| Ví 2 | Vendor 1 | `0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55` |
| Ví 3 | Vendor 2, đặt giá thấp hơn | `0xA4565608e096CFEf7da36eB19a57Da6d277D942f` |

Cả ba ví phải có Sepolia ETH để trả gas. Ví 1 cần public Test USDC để tạo
tender EOA và nạp tiền cho Safe. Một lần `GET TEST USDC` là đủ cho cả hai luồng
demo.

Safe dùng trong phần thứ hai:

```text
0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0
```

Safe là contract treasury do Ví 1 sở hữu, **không phải ví thứ tư**.

### Dữ liệu dùng xuyên suốt video

| Trường | Luồng EOA | Luồng Safe |
| --- | --- | --- |
| Public metadata | `EOA website development tender` | `Safe website development tender` |
| Public ceiling | `10` | `10` |
| Deadline | Thời điểm hiện tại + 15–20 phút | Thời điểm hiện tại + 15–20 phút |
| Vendor 1 | Ví 2 | Ví 2 |
| Vendor 2 | Ví 3 | Ví 3 |
| Bid của Ví 2 | `8` | `8` |
| Bid của Ví 3 | `7` | `7` |

Hai Vendor gửi đủ bid nên tender có thể đóng sớm, không cần chờ deadline.

## 2. Quy tắc trước khi quay

- Chỉ dùng Ethereum Sepolia và test assets.
- Không quay private key, seed phrase, chữ ký, calldata, proof hoặc Nox handle.
- Ô nhập bid là dữ liệu bí mật. Che/crop lúc gõ `8` và `7`, hoặc chỉ quay lại
  sau khi đã mã hóa và gửi thành công.
- Không dùng mock data hoặc giả thông báo thành công.
- Sau mỗi transaction, giữ màn hình 2–3 giây để người xem nhìn thấy toast và
  trạng thái mới.

## 3. Mở Landing Page

1. Mở `https://veilbid-three.vercel.app` khi chưa kết nối ví.
2. Quay phần hero `Public terms. Private bids.`.
3. Cuộn qua ba mascot để giới thiệu ngắn:
   - Vendor gửi bid mã hóa.
   - Nox so sánh giá mà không công khai plaintext.
   - Safe hoặc EOA giữ quyền đối với treasury.
4. Dừng ở phần mô tả privacy: public metadata được công khai, bid và payment
   amount vẫn confidential.
5. Bấm `TENDERS` một lần để cho thấy Public hoạt động không cần wallet, sau đó
   quay lại phần Docs ở bước tiếp theo.

Mục tiêu footage: khoảng 10–15 giây.

## 4. Mở trang Docs

1. Bấm `DOCS` trên thanh điều hướng.
2. Quay nhanh menu tài liệu bên trái và các phần:
   - Quick Start.
   - Public Explorer.
   - EOA Buyer.
   - Private Bids.
   - Safe Buyer.
   - Privacy Boundary.
3. Nhấn mạnh rằng đây là hướng dẫn sử dụng thật của bản Sepolia đang deploy.
4. Bấm `OPEN TENDERS` hoặc `TENDERS` để trở lại ứng dụng.

Mục tiêu footage: khoảng 10–15 giây.

## 5. Kết nối Ví 1 và chuẩn bị tiền

1. Bấm `CONNECT WALLET`.
2. Chọn MetaMask chứa Ví 1:

   ```text
   0xE412d04DA2A211F7ADC80311CC0FF9F03440B64E
   ```

3. Nếu MetaMask chưa ở Sepolia, chấp nhận yêu cầu chuyển mạng.
4. Kiểm tra thanh đầu trang hiển thị `SEPOLIA`.
5. Trong `BALANCES`, bấm refresh và kiểm tra:
   - `SEP ETH` lớn hơn 0.
   - `TEST USDC` đủ ít nhất `20`.
6. Nếu Test USDC chưa đủ, bấm `GET TEST USDC` và xác nhận transaction.

Không cần wrap thủ công trước. Luồng EOA Buyer sẽ tự wrap đúng public ceiling;
luồng Safe Buyer có nút deposit riêng.

## 6. Luồng chính — EOA Buyer

### 6.1. Tạo tender bằng Ví 1

1. Mở workspace `BUYER`.
2. Chọn `EOA BUYER`. Đây là tab mặc định.
3. Trong `CREATE TENDER / DIRECT WALLET`, nhập:

   **Public metadata**

   ```text
   EOA website development tender
   ```

   **Public ceiling**

   ```text
   10
   ```

   **Bid deadline**

   Chọn giờ hiện tại + 15–20 phút theo giờ máy.

4. Trong `APPROVED VENDORS`, nhập:

   **Vendor 1 — Ví 2**

   ```text
   0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
   ```

5. Bấm `+ ADD VENDOR`, sau đó nhập:

   **Vendor 2 — Ví 3**

   ```text
   0xA4565608e096CFEf7da36eB19a57Da6d277D942f
   ```

6. Kiểm tra lại ceiling, deadline và đúng hai Vendor.
7. Bấm `CREATE WITH EOA →`.
8. Xác nhận lần lượt các yêu cầu trong MetaMask. Số lần ký có thể ít hơn nếu
   allowance đã tồn tại; luôn đi theo toast đang xếp chồng trên web.
9. Chờ thông báo:

   ```text
   Tender ... is Open and accepting bids.
   ```

10. Sang `PUBLIC`, chọn filter `Open` và xác nhận tender EOA mới xuất hiện.

### 6.2. Ví 2 gửi bid `8`

1. Chuyển MetaMask sang Ví 2:

   ```text
   0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
   ```

2. Nếu web chưa cập nhật account, bấm wallet trên header và kết nối lại Ví 2.
3. Mở `PRIVATE BIDS → SUBMIT BID`.
4. Chọn tender EOA vừa tạo trong `Active tender`.
5. Che vùng nhập liệu rồi nhập:

   ```text
   8
   ```

6. Bấm `ENCRYPT, SIMULATE & SUBMIT →` và xác nhận transaction.
7. Chờ toast thành công.
8. Có thể mở `MY BID` để cho thấy Ví 2 chỉ quản lý bid do chính mình gửi;
   không reveal plaintext trong footage công khai.

### 6.3. Ví 3 gửi bid thấp hơn `7`

1. Chuyển MetaMask sang Ví 3:

   ```text
   0xA4565608e096CFEf7da36eB19a57Da6d277D942f
   ```

2. Mở `PRIVATE BIDS → SUBMIT BID`.
3. Chọn cùng tender EOA.
4. Che vùng nhập liệu rồi nhập:

   ```text
   7
   ```

5. Bấm `ENCRYPT, SIMULATE & SUBMIT →` và xác nhận transaction.
6. Chờ toast thành công.

### 6.4. Theo dõi đóng và settlement

1. Mở `PUBLIC` và refresh.
2. Vì `2 / 2` Vendor đã gửi bid, tender sẽ hiện `READY TO CLOSE` dù deadline
   chưa đến.
3. Relay sẽ xử lý permissionlessly. Refresh và theo dõi:

   ```text
   READY TO CLOSE → CLOSED → AWARDED
   ```

4. Nếu relay đang ngủ hoặc chậm, kết nối lại Ví 1, mở `ACTIVITY` và dùng
   `ADVANCE MANUALLY` làm fallback. Không cần ví thứ tư.
5. Khi `AWARDED`, xác nhận:
   - Winner công khai là Ví 3.
   - Bid value `7` không xuất hiện trong Public.
   - Award receipt thuộc Ví 3.
   - Ví 3 nhận confidential payment `7 vcUSDC`.
   - Ví 1 nhận confidential remainder `3 vcUSDC`.
6. Vì vẫn đang kết nối Ví 3, quay banner `You won Tender #...`, rồi mở
   `ACTIVITY HISTORY`.
7. Trong `AWARD NOTIFICATIONS`, bấm `VIEW PUBLIC AWARD` để mở đúng award và
   transaction Sepolia. Thao tác này tự ghi nhận thông báo đã mở nhưng bản ghi vẫn được
   giữ trong Activity sau reload vì được dựng lại từ event `TenderAwarded`;
   browser chỉ lưu trạng thái đã mở.

Số dư hiển thị là **tổng balance của ví**, không phải riêng khoản nhận từ tender.
Muốn chứng minh đúng `7` và `3`, cần ghi lại balance trước và sau.

### 6.5. Kiểm tra review access sau award

1. Chuyển lại Ví 1.
2. Mở `PRIVATE BIDS → GRANTED ACCESS`.
3. Chờ web tự kiểm tra ACL on-chain.
4. Các bid của tender vừa finalized sẽ tự xuất hiện; không có nút check quyền
   thủ công.
5. Có thể chọn một bid và bấm `REVEAL IN SESSION →`, nhưng phải crop plaintext
   khỏi video public.
6. Sang `ACTIVITY` để quay lifecycle history, award history và transaction
   links.

Đến đây luồng EOA Buyer đã hoàn chỉnh.

## 7. Làm lại từ đầu — Safe Buyer

Luồng Safe dùng lại ba ví và hai giá bid, nhưng phải tạo **một tender mới**.

### 7.1. Chọn và chuẩn bị Safe bằng Ví 1

1. Đảm bảo đang kết nối Ví 1.
2. Mở `BUYER → SAFE BUYER`.
3. Trong danh sách Safe, chọn:

   ```text
   0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0
   ```

4. Nếu discovery chưa hiện Safe, dán địa chỉ trên vào ô Safe address và bấm
   `CHECK SAFE`.
5. Kiểm tra `SELECTED SAFE` hiển thị:

   ```text
   1 owner(s) · threshold 1
   ```

6. Nếu setup chưa `READY`, bấm `CONFIGURE THIS SAFE →`, xác nhận proposal và
   chờ Safe thực thi.
7. Trong phần deposit, nhập:

   ```text
   10
   ```

8. Bấm `DEPOSIT TO SAFE →`. Tiền được lấy từ public Test USDC của Ví 1 và mint
   thành vcUSDC trực tiếp cho Safe.
9. Dùng biểu tượng con mắt cạnh `vcUSDC` để reveal balance trong session. Làm
   theo từng toast/proposal cho đến khi web hiển thị balance.

### 7.2. Tạo Safe-owned tender

1. Trong `CREATE A SAFE-OWNED TENDER`, nhập:

   **Public metadata**

   ```text
   Safe website development tender
   ```

   **Public ceiling**

   ```text
   10
   ```

   **Bid deadline**

   Chọn giờ hiện tại + 15–20 phút.

2. Nhập lại đúng hai Vendor:

   ```text
   0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
   0xA4565608e096CFEf7da36eB19a57Da6d277D942f
   ```

3. Bấm `CREATE WITH SAFE →`.
4. Xác nhận Safe proposal. Với Safe 1/1, proposal có thể được thực thi ngay sau
   chữ ký của Ví 1.
5. Tiếp tục theo toast để confirm exact funding.
6. Chờ tender Safe chuyển thành `Open`.
7. Sang `PUBLIC → Open` để quay tender mới. Buyer lúc này là địa chỉ Safe,
   không phải EOA Ví 1.

### 7.3. Lặp lại hai bid

1. Chuyển sang Ví 2.
2. Mở `PRIVATE BIDS → SUBMIT BID`, chọn tender Safe mới và gửi bid `8`.
3. Chuyển sang Ví 3.
4. Chọn cùng tender Safe và gửi bid `7`.
5. Che plaintext trong cả hai lần nhập.

### 7.4. Theo dõi kết quả Safe

1. Sang `PUBLIC`, refresh và theo dõi:

   ```text
   READY TO CLOSE → CLOSED → AWARDED
   ```

2. Winner vẫn là Ví 3 vì `7 < 8`.
3. Ví 3 nhận confidential payment `7 vcUSDC`.
4. Phần dư `3 vcUSDC` được trả về **Safe treasury**, không trả trực tiếp cho
   owner Ví 1.
5. Kết nối lại Ví 1 và mở `GRANTED ACCESS` để cho thấy review wallet chỉ được
   cấp quyền sau finalization.
6. Quay `ACTIVITY` để hiển thị lịch sử lifecycle và transaction.
7. Chuyển sang Ví 3 để quay banner thắng Safe tender và bản ghi bền vững trong
   `AWARD NOTIFICATIONS`.

Điểm cần nói trong video: EOA Buyer ký trực tiếp; Safe Buyer yêu cầu quyền owner
và threshold của Safe. Cả hai dùng cùng Market, Nox winner selection, private
bid và settlement logic.

## 8. Thứ tự clip đề xuất

1. `01-landing`
2. `02-docs`
3. `03-wallet-1-balances`
4. `04-eoa-create`
5. `05-eoa-vendor-1`
6. `06-eoa-vendor-2`
7. `07-eoa-award-review`
8. `08-safe-select-fund`
9. `09-safe-create`
10. `10-safe-vendor-1`
11. `11-safe-vendor-2`
12. `12-safe-award-activity`

Quay footage thô dài hơn cũng được. Khi dựng bản submission dưới 4 phút, tăng
tốc các đoạn chờ transaction/proof và chỉ giữ 2–3 giây ở mỗi trạng thái quan
trọng.

## 9. Checklist trước khi bấm Record

- [ ] Đã import đúng ba ví và đang dùng Ethereum Sepolia.
- [ ] Cả ba ví có Sepolia ETH.
- [ ] Ví 1 có ít nhất `20` public Test USDC.
- [ ] Safe `0xBF39…3fbA0` thuộc Ví 1 và có threshold 1/1.
- [ ] Đã chuẩn bị hai metadata khác nhau cho EOA và Safe.
- [ ] Mỗi deadline còn ít nhất 15 phút lúc bắt đầu tạo tender.
- [ ] Hai Vendor được nhập đúng thứ tự: Ví 2 rồi Ví 3.
- [ ] Đã chuẩn bị cách che ô private bid.
- [ ] Không có private key, seed phrase, calldata, proof hoặc handle trong vùng
  quay.
- [ ] Browser notification đã tắt và cửa sổ quay không chứa terminal `.env`.
