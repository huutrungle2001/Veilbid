# Hướng dẫn test đầy đủ VeilBid

Tài liệu này hướng dẫn kiểm tra release VeilBid hiện tại trên Ethereum Sepolia:
Safe Buyer tạo tender bằng một Safe batch nguyên tử, hai Vendor gửi bid mã hóa,
relay công khai xác nhận funding/đóng/finalize, và Auditor chỉ reveal bid đã
được cấp quyền.

Luồng chính là `SAFE BUYER`. `EOA BUYER` vẫn tồn tại như một phương án nâng cao
để thử nghiệm hoặc phục hồi, không phải câu chuyện demo chính.

## 1. Chuẩn bị

### Chạy web local

Có thể kiểm tra production tại:

```text
https://veilbid-three.vercel.app
```

Để chạy local, dùng Node.js `>=24 <25`, sau đó mở:

```text
http://localhost:5173
```

Nếu web chưa chạy:

```bash
corepack pnpm --filter @veilbid/tender-room dev
```

### Chuẩn bị ba tài khoản MetaMask và một Safe

| Vai trò | Địa chỉ |
| --- | --- |
| Safe owner / Buyer | `0xE412d04DA2A211F7ADC80311CC0FF9F03440B64E` |
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

Release hiện tại dùng:

| Thành phần | Địa chỉ |
| --- | --- |
| Demo Safe 1.4.1 | `0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0` |
| Legacy demo Safe module | `0x3786A97Dca2e045DB43D25e5FeE54b2570CFe401` |
| Per-Safe module factory | `0x0Fd3E77A93BE3E1b05a17b2860D492f4244414d4` |
| VeilBid Market | `0x969F93642054130e87AFC8D380eec850617A6048` |

`SAFE BUYER` hoạt động với bất kỳ Safe đã deploy trên Ethereum Sepolia nếu ví
đang kết nối là một owner. Web tự tìm Safe theo owner qua Safe Transaction
Service; người dùng cũng có thể dán địa chỉ Safe thủ công khi dịch vụ discovery
chậm. Nếu owner chỉ có đúng một Safe, web tự chọn Safe đó.

Mỗi Safe mới có một preparation module riêng được factory triển khai bằng
CREATE2. Thiết lập lần đầu vẫn là một Safe proposal và phải đạt đúng threshold
của Safe. Factory không thể enable module, đổi owner, hạ threshold hoặc thực thi
giao dịch thay Safe.

Canonical demo Safe hiện có threshold `1/1` và tiếp tục dùng legacy module đã
được xác minh. Safe mới có thể faucet và wrap trực tiếp bằng batch
`FAUCET + WRAP WITH SAFE`; không cần chuyển vcUSDC từ EOA.

Không sao chép private key vào tài liệu, ảnh chụp, terminal output hoặc Git.
Chỉ dùng các ví này trên testnet.

### Kiểm tra mạng

1. Chọn mạng Ethereum Sepolia trong MetaMask.
2. Kết nối đúng tài khoản với VeilBid.
3. Kiểm tra chỉ báo trên thanh đầu trang hiển thị `SEPOLIA`.
4. Safe owner, Vendor 1 và Vendor 2 phải có Sepolia ETH để trả gas.
5. Xác nhận EOA đang kết nối là owner của Safe muốn dùng.

## 2. Kiểm tra Public và giao diện cơ bản

1. Mở workspace `PUBLIC` khi chưa kết nối ví.
2. Xác nhận danh sách tender được đọc từ Sepolia, không xuất hiện mock data.
3. Nếu danh sách có nhiều tender, dùng bộ lọc trạng thái để chọn dossier cần
   kiểm tra.
4. Chọn một tender và kiểm tra:
   - Public ceiling.
   - Deadline.
   - Buyer.
   - Số bid trên tổng số Vendor được approve.
   - Lifecycle và trạng thái.
   - Transaction fingerprint.
   - Nhãn `CONFIRMED / FINALITY PENDING` nếu transaction chưa qua finality
     window.
5. Hover hoặc focus vào dấu `?` ở góc trên bên phải.
6. Xác nhận tooltip không bị cắt và có hướng dẫn đúng workspace.
7. Thu nhỏ cửa sổ để kiểm tra thanh điều hướng và nội dung không đè nhau.

Kết quả mong đợi: Public hoạt động không cần ví và không hiển thị giá bid hay
số dư bí mật.

## 3. Kiểm tra Balances, faucet, wrap và reveal của EOA

Phần này kiểm tra tiện ích ví của EOA và có thể bỏ qua khi chỉ demo Safe Buyer.
Nó không cấp vốn cho Safe; Safe có batch funding riêng trong mục 4.

1. Kết nối một EOA test trên Sepolia.
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
- Số dư vừa faucet/wrap thuộc EOA đang kết nối, không tự chuyển sang Safe.

## 4. Safe Buyer: chọn Safe, thiết lập, funding và tạo tender

Kết nối một Safe owner và chuyển sang workspace `SAFE BUYER`.

### 4.1. Chọn Safe

1. Chờ web tìm các Safe Sepolia của owner.
2. Web chỉ đánh dấu `LAST USED`, không tự mở chi tiết Safe.
3. Bấm card Safe muốn dùng; selected state và skeleton phải xuất hiện ngay.
4. Nếu discovery không khả dụng, dán địa chỉ Safe rồi bấm `CHECK SAFE`.
5. Xác nhận thẻ `SELECTED SAFE` hiển thị:
   - Safe address.
   - Số owner và threshold.
   - Địa chỉ preparation module riêng của Safe.
   - vcUSDC là `0`, unavailable hoặc được che bằng `••••••`.
   - Nút con mắt và `REFRESH`.
   - `OPEN SAFE` mở đúng Safe đã chọn.
6. Xác nhận Safe Buyer không hiển thị ETH, public vUSDC hoặc token không liên
   quan. Dùng Safe Wallet nếu cần quản lý các tài sản công khai đó.

### 4.2. Thiết lập một lần cho Safe mới

Nếu cả bốn readiness check đã xanh, bỏ qua bước này. Nếu chưa:

1. Bấm `CONFIGURE THIS SAFE`.
2. Kiểm tra Safe proposal gồm tối đa bốn call:
   - Factory deploy module riêng cho Safe nếu chưa tồn tại.
   - Safe tự enable module.
   - Safe gọi module để bind canonical Market.
   - Safe cấp Market làm confidential-token operator.
3. Ký proposal bằng owner hiện tại.
4. Với Safe threshold `1/1`, web tự gửi execution sau chữ ký.
5. Với multisig, mở Safe hoặc dùng `APPROVE / EXECUTE` để các owner còn lại
   ký; web chỉ execute khi đủ threshold.
6. Refresh và xác nhận bốn readiness check đều xanh.

Đây là bước duy nhất được thêm cho một Safe chưa từng dùng VeilBid. Nó không
lặp lại cho mỗi tender.

### 4.3. Nạp confidential vUSDC cho Safe

1. Nhập số lượng vào `Test vcUSDC amount`.
2. Bấm `ADD TEST vcUSDC`.
3. Proposal sẽ tự thêm faucet call khi public vUSDC của Safe chưa đủ, sau đó
   `approve` wrapper và `wrap` vào chính Safe.
4. Ký/thu thập đủ threshold.
5. Xác nhận `SELECTED SAFE` hiển thị vcUSDC dạng `••••••`.

EOA owner trả gas cho transaction thực thi; tài sản được mint/wrap thuộc Safe.

### 4.4. Reveal vcUSDC của Safe

1. Khi vcUSDC hiển thị `••••••`, bấm nút con mắt.
2. Nếu handle chưa được cấp quyền, ký Safe proposal cấp connected owner làm
   viewer cho balance handle hiện tại.
3. Với Safe 1/1, chờ execution hoàn tất rồi bấm con mắt lần nữa.
4. Ký yêu cầu data-access của Nox.
5. Kiểm tra plaintext chỉ xuất hiện trong phiên hiện tại.
6. Sau funding, transfer hoặc unwrap, balance handle đổi; web phải yêu cầu cấp
   quyền lại thay vì tái sử dụng viewer grant cũ.

Viewer grant là per-handle, không cấp operator, signer hoặc quyền xem bid.

### 4.5. Unwrap vcUSDC: toàn bộ hoặc tùy chỉnh

Khối `UNWRAP vcUSDC` nằm ngay trong card `SELECTED SAFE`, không mở lại bảng
quản lý ETH/public vUSDC.

#### Full

1. Giữ chế độ `FULL`.
2. Kiểm tra `Public vUSDC recipient`; mặc định là EOA owner đang kết nối.
3. Bấm `PROPOSE FULL UNWRAP`.
4. Full dùng balance handle mã hóa hiện tại, nên không cần bấm con mắt hoặc
   reveal balance trước.
5. Ký/thu thập đủ threshold cho Safe transaction.

#### Custom

1. Chọn `CUSTOM`.
2. Nếu balance chưa reveal, bấm `AUTHORIZE BALANCE VIEW`, chờ Safe proposal
   execute, rồi bấm `REVEAL BALANCE`.
3. Nhập số vcUSDC nhỏ hơn balance vừa reveal. Muốn rút hết thì chuyển về
   `FULL`, không nhập đúng bằng balance trong Custom.
4. Kiểm tra recipient và bấm `PROPOSE CUSTOM UNWRAP`.
5. Safe batch phải gồm đúng hai call nguyên tử:
   - Adapter xác minh owner-encrypted amount, Safe, balance handle hiện tại và
     nonce mới; quyền Nox chỉ tồn tại trong transaction đó.
   - Wrapper burn lượng vcUSDC đã chọn và tạo unwrap request.
6. Ký/thu thập đủ threshold.

Sau khi Safe execute, bấm `FINALIZE UNWRAP`. Đây là transaction permissionless
thứ hai dùng public-decryption proof để trả public vUSDC cho recipient.

Kết quả mong đợi:

- `FULL` không yêu cầu reveal balance.
- `CUSTOM` yêu cầu reveal để web chặn amount bằng 0, bằng full balance hoặc lớn
  hơn balance; contract còn chặn balance handle cũ và replay nonce/handle.
- Khi finalize, amount unwrap và recipient trở thành công khai.
- Phần vcUSDC còn lại và mọi bid value vẫn confidential.
- Browser không lưu amount đã reveal, encrypted handle, proof hoặc chữ ký.
- Sau partial unwrap, balance handle đổi và viewer grant cũ không được tái sử
  dụng.

### 4.6. Tạo tender

Dùng dữ liệu mẫu:

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
2. Bấm `CREATE WITH SAFE`.
3. Theo dõi toast qua các giai đoạn:
   - Tự tạo và kiểm tra một nonce nội bộ chưa từng dùng. Người dùng không phải
     nhập nonce.
   - Mã hóa confidential budget cho module riêng của Safe.
   - Tạo một atomic Safe batch gồm `prepareInputForSafe` và
     `createTenderAuthorized`.
   - Chờ Safe owner ký approval.
   - Publish proposal lên Safe Transaction Service.
   - Khi threshold đạt đủ, gửi transaction thực thi batch lên Sepolia.
4. Với Safe threshold `1/1`, xác nhận một chữ ký Safe và một
   transaction thực thi trong MetaMask.
5. Kiểm tra phần kết quả hiển thị:
   - Safe transaction hash.
   - Threshold progress đúng với Safe đã chọn.
   - Link `Confirmed on Sepolia`.
6. Nếu Safe Transaction Service chưa cập nhật, bấm `REFRESH SIGNATURES`.
   `COPY BATCH JSON` và `OPEN SAFE` chỉ là handoff phục hồi, không phải bước
   bắt buộc của luồng threshold `1/1`.
7. Nếu là multisig, proposal chưa đủ chữ ký xuất hiện trong
   `PENDING APPROVALS` và tự refresh trạng thái. Với Safe 1/1, action đã execute
   chuyển vào `TRANSACTION HISTORY` thu gọn. Browser chỉ lưu Safe address, Safe
   transaction hash, loại action và timestamp công khai; không lưu handle,
   proof, chữ ký, recipient, amount hoặc plaintext.
8. Ghi lại Tender ID từ `PUBLIC` sau khi transaction được index.
9. Tender ban đầu có thể ở `FundingPending`. Relay sẽ lấy public
    exact-funding proof và gọi confirmation mà không cần Buyer ký thêm.
10. Refresh `PUBLIC` cho đến khi tender chuyển sang `Open`.

Kết quả mong đợi:

- Preparation và tạo tender nằm trong cùng một Safe transaction nguyên tử.
- Chỉ Safe transaction đạt threshold mới có thể chuyển confidential budget.
- Tender chỉ mở sau khi exact funding được chứng minh.
- Buyer của tender là địa chỉ Safe đã chọn, không phải EOA owner.
- Public ceiling là `10 vUSDC`.
- Hai địa chỉ Vendor là metadata công khai.
- Safe owner không tự động thấy plaintext bid của Vendor.
- Relay funding không nhận plaintext amount, handle hay proof từ người dùng.

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
8. Khi cả hai Vendor đã gửi bid, tender đủ điều kiện đóng sớm mà không cần chờ
   deadline. Relay có thể xử lý ngay.

Kết quả mong đợi:

- Giá `7` và `8` đều không xuất hiện trong Public.
- Mỗi Vendor chỉ gửi được một bid bất biến cho tender.
- Vendor không nằm trong allowlist không thể gửi bid.
- `2 / 2` Vendor đã gửi là điều kiện close hợp lệ trước deadline.

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

## 8. Relay tự động close, proof và settlement

Luồng mặc định không yêu cầu Buyer hoặc Vendor ký thêm sau khi đã có đủ bid:

1. Sau bid thứ hai, mở `PUBLIC` và refresh.
2. Theo dõi tender đi qua:
   - `Open`.
   - `Closed`.
   - `Awarded` hoặc `Refunded`.
3. Relay sẽ:
   - Reread trạng thái công khai.
   - Close tender khi đủ Vendor đã bid hoặc deadline đã qua.
   - Chỉ yêu cầu public decryption cho encrypted winner ID.
   - Gửi proof lên `finalizeTender`.
4. Không nhập winner address hoặc bid value vào relay hay UI.
5. Nếu Nox proof chưa sẵn sàng, tender phải ở lại `Closed`; không được hiển thị
   mock success hoặc tự refund theo timeout.

### Activity chỉ dùng khi relay chậm hoặc cần phục hồi

1. Mở workspace `ACTIVITY`.
2. Kiểm tra phần `RECOVERABLE CHECKPOINTS`. Nếu một thao tác browser trước đó
   bị gián đoạn, kết nối đúng ví và bấm `RESUME`.
3. Nếu relay chưa close/finalize sau một khoảng chờ hợp lý, kết nối một ví có
   Sepolia ETH và xem `MANUAL RELAY FALLBACK`.
4. Với tender đang `Open` và đã đủ điều kiện, bấm `CLOSE & TRACK`.
5. Với tender đã `Closed`, bấm `TRACK PROOF`.
6. Xác nhận transaction cần thiết trong MetaMask.
7. Nếu proof chưa sẵn sàng, checkpoint vẫn phải còn trong
   `RECOVERABLE CHECKPOINTS`; thử `RESUME` sau, không tạo tender mới.
8. Sang `PUBLIC` và refresh trạng thái.

Kết quả mong đợi:

- Tender kết thúc ở `Awarded`.
- Winner là Vendor 2 vì bid `7` thấp hơn bid `8`.
- Chỉ địa chỉ winner trở thành public; hai giá bid vẫn bí mật.
- Award receipt được mint cho winner.
- Finalization không nhận winner plaintext do client cung cấp.
- Relay hoặc người gọi fallback chỉ trả gas; họ không chọn winner và không có
  quyền decrypt bid price.

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

Sidebar `BALANCES` hiển thị EOA đang kết nối; thẻ `SELECTED SAFE` trong Safe
Buyer mới hiển thị tài sản của Safe. Cả hai chỉ hiển thị trạng thái encrypted
cho confidential balance trừ khi chính holder thực hiện reveal được cho phép.
Confidential payment và remainder được assert trong bộ test Sepolia và không
lưu plaintext vào evidence công khai.

## 10. EOA Buyer — fallback nâng cao

Chỉ dùng workspace `EOA BUYER` khi cần thử luồng ví cá nhân hoặc khi không có
Safe mà ví hiện tại sở hữu.

1. Kết nối EOA trên Sepolia.
2. Bảo đảm EOA có Sepolia ETH. App có thể tự lấy Test USDC và wrap đúng public
   ceiling khi tạo tender.
3. Nhập public metadata, ceiling, deadline và 1–8 Vendor.
4. Bấm `PREPARE & FUND TENDER`.
5. Xác nhận lần lượt các transaction cần thiết:
   - Faucet Test USDC nếu thiếu.
   - Approve wrapper.
   - Wrap sang confidential vcUSDC.
   - Authorize Market operator.
   - Create và fund tender.
6. Khi toast báo tender đã submit, không chờ browser tự lấy funding proof như
   phiên bản cũ. Relay sẽ confirm exact funding và mở tender.
7. Nếu relay chậm hoặc thao tác bị gián đoạn, mở `ACTIVITY` và dùng checkpoint
   funding tương ứng.

Kết quả mong đợi:

- Tender Buyer là EOA đang kết nối.
- Tender vẫn phải đi qua `FundingPending` trước khi `Open`.
- EOA Buyer không được cung cấp winner và không tự động xem bid khi tender đang
  mở.
- Đây là fallback; video submission nên ưu tiên Safe Buyer để giữ đúng định vị
  “Confidential procurement for Safe treasuries”.

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
11. Dùng ví không phải owner trong `SAFE BUYER`: UI phải báo lỗi, không tạo
    proposal giả.
12. Tạo nhiều tender liên tiếp: web phải tự chọn nonce mới; contract vẫn phải
    từ chối một nonce đã consume nếu raw calldata bị replay.
13. Khi Safe Transaction Service lỗi, UI phải giữ raw batch handoff; không được
    báo đã execute nếu chưa có transaction Sepolia.
14. Tắt hoặc revoke module: bước chuẩn bị phải dừng trước khi chuyển tiền.

## 12. Checklist hoàn tất

- [ ] Public hoạt động không cần ví.
- [ ] Ba tài khoản kết nối đúng trên Sepolia.
- [ ] Safe owner, Safe đã chọn, Market và module/factory đúng canonical release.
- [ ] Safe discovery hoặc nhập địa chỉ thủ công hoạt động.
- [ ] Safe mới hoàn tất one-time setup qua đúng threshold.
- [ ] Safe funding batch tạo confidential budget thành công.
- [ ] Optional: faucet/manual wrap của EOA hoạt động.
- [ ] Optional: EOA vcUSDC reveal chỉ tồn tại trong session.
- [ ] Safe Buyer tạo atomic preparation/create batch thành công.
- [ ] Safe transaction đạt threshold và được execute trên Sepolia.
- [ ] Relay confirm exact funding thành công.
- [ ] Tender chuyển sang `Open`.
- [ ] Hai Vendor gửi hai bid mã hóa.
- [ ] Public hiển thị `2 / 2` Vendor đã bid và không lộ giá.
- [ ] Viewer grant chỉ áp dụng cho một bid.
- [ ] Auditor check ACL và reveal đúng bid.
- [ ] Relay close sớm khi đủ Vendor và finalize proof thành công.
- [ ] Optional: Activity manual fallback/checkpoint recovery hoạt động.
- [ ] Vendor 2 thắng với bid thấp nhất.
- [ ] Award receipt được tạo.
- [ ] Toast hiển thị đúng từng giai đoạn và không bị treo.
- [ ] Module preparation không có quyền tự execute từ Safe.
- [ ] Safe owner EOA không thay thế Buyer Safe hoặc vượt qua threshold.
- [ ] Không có private key, plaintext bid, confidential balance, handle hoặc
      proof trong log/evidence.
