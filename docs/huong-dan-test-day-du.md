# Hướng dẫn test đầy đủ VeilBid

Tài liệu này hướng dẫn kiểm tra toàn bộ luồng VeilBid trên Ethereum Sepolia,
từ cấp test token, tạo tender, gửi hai bid mã hóa, chọn người thắng, selective
disclosure đến kiểm tra các giới hạn Safe.

## 1. Chuẩn bị

### Chạy web local

Mở:

```text
http://localhost:5173
```

Nếu web chưa chạy:

```bash
corepack pnpm --filter @veilbid/tender-room dev
```

### Chuẩn bị ba tài khoản MetaMask

| Vai trò | Địa chỉ |
| --- | --- |
| Buyer | `0xE412d04DA2A211F7ADC80311CC0FF9F03440B64E` |
| Vendor 1 | `0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55` |
| Vendor 2 kiêm Auditor | `0xA4565608e096CFEf7da36eB19a57Da6d277D942f` |

Import các tài khoản test vào MetaMask bằng private key tương ứng trong
`.env.local`:

- Buyer: `SEPOLIA_PRIVATE_KEY`
- Vendor 1: `SEPOLIA_TEST_VENDOR_PRIVATE_KEY`
- Vendor 2/Auditor: `SEPOLIA_TEST_AUDITOR_PRIVATE_KEY`

`SEPOLIA_VENDOR_PRIVATE_KEY` thuộc vendor của canonical release lifecycle
(`0x4d2809486012076B2212C829742BD95eF5992dB0`), không phải Vendor 1 trong
hướng dẫn test ba trình duyệt này.

Không sao chép private key vào tài liệu, ảnh chụp, terminal output hoặc Git.
Chỉ dùng các ví này trên testnet.

### Kiểm tra mạng

1. Chọn mạng Ethereum Sepolia trong MetaMask.
2. Kết nối đúng tài khoản với VeilBid.
3. Kiểm tra chỉ báo trên thanh đầu trang hiển thị `SEPOLIA`.
4. Vendor 1 và Vendor 2 phải có khoảng `0.1 Sepolia ETH` để trả gas.

## 2. Kiểm tra Public và giao diện cơ bản

1. Mở workspace `PUBLIC` khi chưa kết nối ví.
2. Xác nhận danh sách tender được đọc từ Sepolia, không xuất hiện mock data.
3. Chọn một tender và kiểm tra:
   - Public ceiling.
   - Deadline.
   - Buyer.
   - Bid count.
   - Lifecycle và trạng thái.
   - Transaction fingerprint.
4. Hover hoặc focus vào dấu `?` ở góc trên bên phải.
5. Xác nhận tooltip không bị cắt và có hướng dẫn đúng workspace.
6. Thu nhỏ cửa sổ để kiểm tra thanh điều hướng và nội dung không đè nhau.

Kết quả mong đợi: Public hoạt động không cần ví và không hiển thị giá bid hay
số dư bí mật.

## 3. Kiểm tra Balances, faucet, wrap và reveal

Thực hiện bằng ví Buyer.

1. Kết nối Buyer trên Sepolia.
2. Trong `BALANCES`, kiểm tra:
   - `SEP ETH`.
   - `TEST USDC`.
   - `vcUSDC`.
3. Nếu cần, bấm `GET TEST USDC` và xác nhận giao dịch.
4. Kiểm tra toast góc dưới bên phải:
   - Đang mô phỏng/chờ ví.
   - Đang xác nhận.
   - Thành công hoặc lỗi.
5. Bấm `WRAP TO vcUSDC`.
6. Nhập:

```text
1
```

7. Bấm `APPROVE & WRAP`.
8. Xác nhận giao dịch approve nếu MetaMask yêu cầu.
9. Xác nhận giao dịch wrap.
10. Sau khi hoàn tất, kiểm tra `vcUSDC` chuyển thành `ENCRYPTED`.
11. Bấm biểu tượng mắt bên cạnh `vcUSDC`.
12. Xác nhận yêu cầu của ví để reveal.
13. Kiểm tra số dư rõ chỉ xuất hiện trong phiên trình duyệt hiện tại.
14. Bấm mắt lần nữa để ẩn.

Kết quả mong đợi:

- Khi số dư là `NONE`, biểu tượng mắt vẫn hiện nhưng bị vô hiệu hóa.
- Khi có vcUSDC, biểu tượng mắt hoạt động.
- Giá trị rõ không xuất hiện trong URL, local storage, log hoặc Public.
- Refresh, đổi tài khoản hoặc đổi mạng phải xóa giá trị đã reveal.

## 4. Buyer tạo tender

Chuyển sang workspace `BUYER` và dùng dữ liệu mẫu:

| Trường | Giá trị mẫu |
| --- | --- |
| Public metadata | `Website development tender` |
| Public ceiling | `10` |
| Public bid deadline | Thời gian hiện tại cộng 10–15 phút |
| Approved vendors | Hai địa chỉ Vendor bên dưới |

Approved vendors:

```text
0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
0xA4565608e096CFEf7da36eB19a57Da6d277D942f
```

Các bước:

1. Kiểm tra deadline còn đủ thời gian để gửi hai bid.
2. Bấm `PREPARE & FUND TENDER`.
3. Xác nhận từng yêu cầu MetaMask theo thứ tự.
4. Theo dõi toast cho các bước:
   - Kiểm tra/cấp Test USDC nếu thiếu.
   - Approve wrapper.
   - Wrap confidential token.
   - Authorize market operator.
   - Create tender.
   - Chờ exact-funding proof.
   - Confirm funding.
5. Không đóng tab khi proof đang được xử lý.
6. Khi hoàn tất, ghi lại Tender ID.
7. Sang `PUBLIC`, refresh và xác nhận tender có trạng thái `OPEN`.

Kết quả mong đợi:

- Tender chỉ mở sau khi exact funding được chứng minh.
- Public ceiling là `10 vUSDC`.
- Hai địa chỉ Vendor là metadata công khai.
- Buyer không thấy plaintext bid của Vendor.

## 5. Vendor 1 gửi bid

1. Chuyển MetaMask sang Vendor 1:

```text
0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
```

2. Mở workspace `VENDOR`.
3. Chọn tender vừa tạo.
4. Nhập private bid:

```text
8
```

5. Bấm `ENCRYPT, SIMULATE & SUBMIT`.
6. Theo dõi toast:
   - Kiểm tra admission.
   - Encrypt price.
   - Simulate transaction.
   - Chờ ký ví.
   - Chờ Sepolia confirmation.
7. Xác nhận giao dịch trong MetaMask.
8. Sang `PUBLIC`, refresh và kiểm tra bid count tăng lên `1`.

Kết quả mong đợi: Public biết Vendor đã gửi bid nhưng không hiển thị giá `8`.

## 6. Vendor 2 gửi bid thấp hơn

1. Chuyển MetaMask sang Vendor 2:

```text
0xA4565608e096CFEf7da36eB19a57Da6d277D942f
```

2. Mở workspace `VENDOR`.
3. Chọn cùng tender.
4. Nhập private bid:

```text
7
```

5. Bấm `ENCRYPT, SIMULATE & SUBMIT`.
6. Xác nhận giao dịch và chờ toast thành công.
7. Sang `PUBLIC`, refresh và kiểm tra bid count tăng lên `2`.

Kết quả mong đợi:

- Giá `7` và `8` đều không xuất hiện trong Public.
- Mỗi Vendor chỉ gửi được một bid bất biến cho tender.
- Vendor không nằm trong allowlist không thể gửi bid.

## 7. Test Selective Disclosure và Auditor

### Vendor 1 cấp quyền

1. Chuyển lại tài khoản Vendor 1.
2. Mở workspace `VENDOR`.
3. Tại `SELECTIVE DISCLOSURE`, chọn bid của Vendor 1.
4. Nhập Viewer address:

```text
0xA4565608e096CFEf7da36eB19a57Da6d277D942f
```

5. Bấm `GRANT THIS BID`.
6. Theo dõi toast qua simulate, chờ ký và chờ confirmation.
7. Xác nhận giao dịch.

### Auditor kiểm tra và reveal

1. Chuyển sang tài khoản Vendor 2/Auditor.
2. Mở workspace `AUDITOR`.
3. Chọn đúng Tender ID và Bid ID của Vendor 1.
4. Bấm `CHECK VIEWER ACCESS`.
5. Xác nhận thông báo `Authorized for this bid only`.
6. Bấm `REVEAL IN SESSION`.
7. Xác nhận yêu cầu ví.
8. Kiểm tra giá bid của Vendor 1 được reveal trong phiên.
9. Đổi tài khoản hoặc reload và xác nhận plaintext bị xóa.

Không chụp hoặc lưu giá reveal vào public evidence.

Kết quả mong đợi: quyền chỉ áp dụng cho đúng bid đã grant; Auditor không có
quyền token operator, Buyer, Vendor khác, Safe signer hoặc protocol admin.

## 8. Close, proof và settlement trong Activity

1. Chờ qua bid deadline.
2. Kết nối một ví có Sepolia ETH; có thể dùng Buyer.
3. Mở workspace `ACTIVITY`.
4. Tại `PERMISSIONLESS ACTIONS`, tìm tender vừa test.
5. Bấm `CLOSE & TRACK`.
6. Xác nhận giao dịch close và chờ confirmation.
7. Kiểm tra checkpoint xuất hiện trong `RECOVERABLE CHECKPOINTS`.
8. Bấm `RESUME`.
9. Chờ Nox xử lý encrypted argmin và public winner-ID proof.
10. Xác nhận giao dịch finalize khi MetaMask yêu cầu.
11. Nếu proof chưa sẵn sàng, giữ checkpoint và thử `RESUME` lại; không tạo
    tender mới và không cung cấp winner từ client.
12. Sang `PUBLIC`, refresh trạng thái.

Kết quả mong đợi:

- Tender kết thúc ở `AWARDED`.
- Winner là Vendor 2 vì bid `7` thấp hơn bid `8`.
- Chỉ địa chỉ winner trở thành public; hai giá bid vẫn bí mật.
- Award receipt được mint cho winner.
- Finalization không nhận winner plaintext do client cung cấp.

## 9. Kiểm tra kết quả cuối

Trong `PUBLIC`, kiểm tra:

1. Lifecycle đã đi đến trạng thái terminal.
2. Winner:

```text
0xA4565608e096CFEf7da36eB19a57Da6d277D942f
```

3. Award receipt tồn tại và không transferable.
4. Finalization transaction hiển thị.
5. Bid count vẫn là `2`.
6. Không có plaintext bid hoặc confidential balance.

Trong `BALANCES`, refresh và kiểm tra số dư confidential thay đổi phù hợp với
settlement. Chỉ reveal bằng đúng ví có quyền.

## 10. Kiểm tra Safe Treasury

1. Mở workspace `SAFE TREASURY`.
2. Kiểm tra dấu `?` mô tả rõ preparation không phải execution.
3. Nhập thử metadata, ceiling, deadline, hai Vendor và nonce dương.
4. Bấm `PREPARE INPUT ONLY`.

Kết quả hiện tại được chấp nhận:

- Release manifest canonical ghi preparation module đang enabled; giao diện vẫn
  kiểm tra lại trạng thái live trước mỗi lần chuẩn bị.
- UI phải hiển thị lỗi rõ ràng thay vì giả lập thành công.
- Module không được tự gọi Safe execution hoặc di chuyển tiền của Safe.
- Nếu module bị revoke trong tương lai, muốn bật lại phải dùng giao dịch Safe
  đạt threshold bình thường.

## 11. Kiểm tra lỗi và session

Thực hiện thêm các trường hợp:

1. Chuyển MetaMask sang mạng khác: write actions phải bị vô hiệu hóa và có
   hướng dẫn chuyển lại Sepolia.
2. Từ chối một wallet prompt: toast phải đổi sang lỗi, không treo loading.
3. Nhập wrap amount lớn hơn Test USDC: UI phải báo lỗi trước khi gửi.
4. Nhập bid lớn hơn public ceiling: UI phải từ chối.
5. Dùng ví không được approve để gửi bid: giao dịch không được tiếp tục.
6. Gửi bid lần hai từ cùng Vendor: phải bị từ chối.
7. Đổi account giữa lúc đang xem plaintext: plaintext phải bị xóa.
8. Reload Public khi RPC lỗi: hiển thị lỗi và nút retry, không dùng mock data.
9. Hover/focus dấu `?` của từng workspace và Balances.
10. Kiểm tra toast không che nút chính ở desktop và mobile.

## 12. Checklist hoàn tất

- [ ] Public hoạt động không cần ví.
- [ ] Ba tài khoản kết nối đúng trên Sepolia.
- [ ] Faucet và manual wrap hoạt động.
- [ ] vcUSDC reveal chỉ tồn tại trong session.
- [ ] Buyer tạo và exact-fund tender thành công.
- [ ] Tender chuyển sang Open.
- [ ] Hai Vendor gửi hai bid mã hóa.
- [ ] Public bid count là 2 và không lộ giá.
- [ ] Viewer grant chỉ áp dụng cho một bid.
- [ ] Auditor check ACL và reveal đúng bid.
- [ ] Activity close, resume proof và finalize thành công.
- [ ] Vendor 2 thắng với bid thấp nhất.
- [ ] Award receipt được tạo.
- [ ] Toast hiển thị đúng từng giai đoạn và không bị treo.
- [ ] Safe preparation không vượt qua Safe threshold.
- [ ] Không có private key, plaintext bid, confidential balance, handle hoặc
      proof trong log/evidence.
