# Hướng dẫn test đầy đủ VeilBid

Tài liệu này hướng dẫn kiểm tra release VeilBid hiện tại trên Ethereum Sepolia:
Safe Buyer tạo tender bằng một Safe batch nguyên tử, hai Vendor gửi bid mã hóa,
relay công khai xác nhận funding/đóng/finalize, và review wallet chỉ được tự
động cấp quyền xem bid sau finalization.

Thanh workspace chính gồm `PUBLIC`, `BUYER`, `PRIVATE BIDS` và `ACTIVITY`.
Trong `BUYER` chọn `SAFE BUYER` hoặc `EOA BUYER`; trong `PRIVATE BIDS` chọn
`SUBMIT BID`, `MY BID` hoặc `GRANTED ACCESS`. Video có thể ưu tiên Safe Buyer để
nhấn mạnh Safe, còn EOA Buyer là luồng trực tiếp đầy đủ cho người dùng không
muốn sử dụng Safe.

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
| Vendor 2 | `0xA4565608e096CFEf7da36eB19a57Da6d277D942f` |

Import các tài khoản test vào MetaMask bằng private key tương ứng trong
`.env.local`:

- Buyer: `SEPOLIA_PRIVATE_KEY`
- Vendor 1: `SEPOLIA_TEST_VENDOR_PRIVATE_KEY`
- Vendor 2: `SEPOLIA_TEST_AUDITOR_PRIVATE_KEY`

`SEPOLIA_VENDOR_PRIVATE_KEY` thuộc vendor của canonical release lifecycle
(`0x4d2809486012076B2212C829742BD95eF5992dB0`), không phải Vendor 1 trong
hướng dẫn test ba trình duyệt này.

Release hiện tại dùng:

| Thành phần | Địa chỉ |
| --- | --- |
| Demo Safe 1.4.1 | `0xBF39C8C9C196f1a06bB122abea350eC63AB3fbA0` |
| Canonical Safe module | `0x60a3ed162b13E7Fd8b0139547Aa1B38F41a774C0` |
| Per-Safe module factory | `0x6C09f72FF67eE0bfAD7D45DFFde5bd06228050BE` |
| VeilBid Market | `0x720ac8Ae5dE78590FF5184E53130460033228afc` |

`SAFE BUYER` hoạt động với bất kỳ Safe đã deploy trên Ethereum Sepolia nếu ví
đang kết nối là một owner. Web tự tìm Safe theo owner qua Safe Transaction
Service; người dùng cũng có thể dán địa chỉ Safe thủ công khi dịch vụ discovery
chậm. Web không tự mở chi tiết Safe, kể cả khi owner chỉ có một Safe; người dùng
luôn bấm chọn card để xác nhận đúng treasury trước khi tiếp tục.

Mỗi Safe mới có một preparation module riêng được factory triển khai bằng
CREATE2. Thiết lập lần đầu vẫn là một Safe proposal và phải đạt đúng threshold
của Safe. Factory không thể enable module, đổi owner, hạ threshold hoặc thực thi
giao dịch thay Safe.

Canonical demo Safe hiện có threshold `1/1` và dùng canonical module đã được
xác minh. Để nạp Safe, ví kết nối lấy public Test USDC bằng `GET TEST USDC`, sau
đó nhập `vcUSDC amount` và bấm `DEPOSIT TO SAFE`. Wrapper mint vcUSDC trực tiếp
cho Safe đã chọn; người dùng không phải chuyển vcUSDC từ EOA sang Safe.

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
   - Review wallet.
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

## 3. Kiểm tra Balances, faucet, wrap, reveal và unwrap của EOA

Phần này kiểm tra tiện ích ví của EOA và có thể bỏ qua khi chỉ demo Safe Buyer.
`WRAP TO vcUSDC` mint cho chính EOA; Safe Buyer có nút riêng để dùng public
`TEST USDC` của EOA và mint vcUSDC thẳng vào Safe.

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
15. Bấm `UNWRAP vcUSDC`; khung phải có cùng style với `WRAP TO vcUSDC`.
16. Chọn `FULL` để unwrap toàn bộ mà không cần reveal, hoặc reveal balance rồi
    nhập một amount tùy chỉnh nhỏ hơn balance.
17. Bấm `UNWRAP FULL` hoặc `UNWRAP CUSTOM`, xác nhận unwrap request, chờ public
    proof rồi xác nhận finalization.
18. Kiểm tra public Test USDC trở về chính EOA đang kết nối. Nếu proof chưa sẵn
    sàng, mở lại khung và dùng `FINALIZE PENDING UNWRAP`; web không burn lần hai.

Kết quả mong đợi:

- Khi số dư là `NONE`, biểu tượng mắt vẫn hiện nhưng bị vô hiệu hóa.
- Khi có vcUSDC, biểu tượng mắt hoạt động.
- Giá trị rõ không xuất hiện trong URL, local storage, log hoặc Public.
- Refresh, đổi tài khoản hoặc đổi mạng phải xóa giá trị đã reveal.
- Số dư vừa faucet/wrap thuộc EOA đang kết nối, không tự chuyển sang Safe.
- Full unwrap không cần reveal; custom unwrap yêu cầu balance đã reveal.
- Amount và recipient trở thành public khi finalize; vcUSDC còn lại vẫn
  confidential.

## 4. Safe Buyer: chọn Safe, thiết lập, funding và tạo tender

Kết nối một Safe owner và chuyển sang workspace `SAFE BUYER`.

### 4.1. Chọn Safe

1. Chờ web tìm các Safe Sepolia của owner.
2. Web chỉ đánh dấu `LAST USED`, không tự mở chi tiết Safe.
3. Bấm card Safe muốn dùng; selected state và skeleton phải xuất hiện ngay.
4. Nếu discovery không khả dụng, dán địa chỉ Safe rồi bấm `CHECK SAFE`.
5. Nếu ví chưa sở hữu Safe nào, bấm `CREATE MY SAFE 1/1`, xác nhận giao dịch
   deploy, chờ Safe mới xuất hiện rồi bấm card của Safe đó. Việc tạo Safe không
   tự cấu hình VeilBid; one-time setup vẫn là proposal riêng ở bước 4.5.
6. Xác nhận thẻ `SELECTED SAFE` hiển thị:
   - Safe address.
   - Số owner và threshold.
   - Khối `SAFE FUNDS` nhỏ gọn.
   - vcUSDC là `0`, unavailable hoặc được che bằng `••••••` trong một dòng.
   - Nút con mắt và `REFRESH`.
   - `OPEN SAFE` mở đúng Safe đã chọn.
7. Xác nhận Safe Buyer không hiển thị ETH, public vUSDC hoặc token không liên
   quan. Dùng Safe Wallet nếu cần quản lý các tài sản công khai đó.

### 4.2. Nạp confidential vcUSDC cho Safe từ ví kết nối

1. Nhập số lượng vào `vcUSDC amount`.
2. Bấm `DEPOSIT TO SAFE`.
3. Nếu ví không đủ public `TEST USDC`, dùng `GET TEST USDC` trong `BALANCES`
   rồi thử lại.
4. Xác nhận approve wrapper nếu allowance chưa đủ, sau đó xác nhận wrap.
5. Xác nhận `SELECTED SAFE` hiển thị vcUSDC dạng `••••••`.

Luồng deposit cần một hoặc hai giao dịch do EOA đang kết nối ký và trả gas:
approve wrapper chỉ xuất hiện khi allowance chưa đủ, sau đó là giao dịch wrap.
Recipient của lệnh wrap là Safe đã chọn, nên vcUSDC được mint thuộc Safe. Đây
không phải Safe proposal và không cần cấu hình module trước.

### 4.3. Reveal vcUSDC của Safe

1. Khi vcUSDC hiển thị `••••••`, bấm nút con mắt.
2. Nếu handle chưa được cấp quyền, ký Safe proposal cấp connected owner làm
   viewer cho balance handle hiện tại.
3. Với Safe 1/1, web chờ execution hoàn tất rồi tự chuyển sang bước decrypt;
   không bấm con mắt lần thứ hai.
4. Ký yêu cầu data-access của Nox trong cùng luồng thông báo.
5. Kiểm tra plaintext xuất hiện ngay sau chữ ký cuối và chỉ tồn tại trong phiên
   hiện tại.
6. Sau funding, transfer hoặc unwrap, balance handle đổi; web phải yêu cầu cấp
   quyền lại thay vì tái sử dụng viewer grant cũ.

Viewer grant là per-handle, không cấp operator, signer hoặc quyền xem bid.

### 4.4. Unwrap vcUSDC: toàn bộ hoặc tùy chỉnh

Khối `UNWRAP vcUSDC` nằm ngay trong card `SELECTED SAFE`, không mở lại bảng
quản lý ETH/public vUSDC.

Giao diện không còn hai tab Full/Custom. Chỉ có một ô amount và nút `FULL`
ngay bên cạnh.

#### Rút toàn bộ

1. Bấm `FULL`; nút chuyển thành `FULL ✓` và ô amount hiển thị
   `FULL BALANCE`.
2. Kiểm tra `PUBLIC vUSDC RECIPIENT`; địa chỉ này bị khóa cố định là ví EOA
   đang kết nối.
3. Bấm `PROPOSE FULL UNWRAP`.
4. Full dùng balance handle mã hóa hiện tại, nên không cần bấm con mắt hoặc
   reveal balance trước.
5. Ký/thu thập đủ threshold cho Safe transaction.

#### Rút lượng tùy chỉnh

1. Nếu `FULL ✓` đang được chọn, bấm lại nút đó để quay về nhập amount.
2. Nếu balance chưa reveal, bấm `REVEAL BALANCE`; web tự chạy viewer grant,
   chờ Safe execute rồi nối tiếp sang decrypt mà không cần bấm lại.
3. Nhập số vcUSDC nhỏ hơn balance vừa reveal. Muốn rút hết thì chuyển về
   `FULL`, không nhập đúng bằng balance trong Custom.
4. Kiểm tra recipient là ví đang kết nối và bấm `PROPOSE CUSTOM UNWRAP`.
5. Safe batch phải gồm đúng hai call nguyên tử:
   - Adapter xác minh owner-encrypted amount, Safe, balance handle hiện tại và
     nonce mới; quyền Nox chỉ tồn tại trong transaction đó.
   - Wrapper burn lượng vcUSDC đã chọn và tạo unwrap request.
6. Ký/thu thập đủ threshold.

Sau khi Safe execute, bấm `FINALIZE UNWRAP`. Đây là transaction permissionless
thứ hai dùng public-decryption proof để trả public vUSDC cho recipient.

Kết quả mong đợi:

- Nút `FULL` không yêu cầu reveal balance.
- Amount tùy chỉnh yêu cầu reveal để web chặn amount bằng 0, bằng full balance hoặc lớn
  hơn balance; contract còn chặn balance handle cũ và replay nonce/handle.
- Khi finalize, amount unwrap và recipient trở thành công khai.
- Phần vcUSDC còn lại và mọi bid value vẫn confidential.
- Browser không lưu amount đã reveal, encrypted handle, proof hoặc chữ ký.
- Sau partial unwrap, balance handle đổi và viewer grant cũ không được tái sử
  dụng.

### 4.5. Cấu hình khi cần và tạo tender

Trong thẻ `CREATE A SAFE-OWNED TENDER`, kiểm tra trạng thái setup:

1. Nếu thấy `SAFE READY ✓`, không cần thêm bước cấu hình.
2. Nếu thấy `CONFIGURE THIS SAFE`, bấm nút và kiểm tra proposal gồm tối đa bốn
   call: deploy module riêng, enable module, bind canonical Market và cấp Market
   làm confidential-token operator.
3. Ký/thu thập đủ threshold. Safe `1/1` tự gửi execution; multisig chỉ execute
   sau khi đủ owner approval.
4. Sau khi hoàn tất, trạng thái chuyển thành `SAFE READY ✓` và
   `CREATE WITH SAFE` được bật.

Đây là bước thêm một lần cho Safe chưa từng dùng VeilBid. Nó chỉ cần cho việc
tạo tender; deposit, reveal và unwrap không bị đặt sai dưới bước cấu hình này.

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

Các bước tạo tender:

1. Trong dòng `TENDER TERMS`, bấm con mắt cạnh giá trị `vcUSDC` và hoàn tất
   viewer grant/decrypt nếu balance hiện tại chưa được reveal. Nút Create phải
   bị khóa trước bước này.
2. Nhập public ceiling không lớn hơn giá trị `vcUSDC` đã reveal; web phải chặn
   ngay nếu vượt balance. Kiểm tra deadline còn đủ thời gian gửi hai bid.
3. Bấm `CREATE WITH SAFE`.
4. Theo dõi toast qua các giai đoạn:
   - Tự tạo và kiểm tra một nonce nội bộ chưa từng dùng. Người dùng không phải
     nhập nonce.
   - Mã hóa confidential budget cho module riêng của Safe.
   - Tạo một atomic Safe batch gồm `prepareInputForSafe` và
     `createTenderAuthorized`.
   - Chờ Safe owner ký approval.
   - Publish proposal lên Safe Transaction Service.
   - Khi threshold đạt đủ, gửi transaction thực thi batch lên Sepolia.
5. Với Safe threshold `1/1`, xác nhận một chữ ký Safe và một
   transaction thực thi trong MetaMask.
6. Sau khi Safe batch tạo tender, chờ web lấy exact-funding proof rồi xác nhận
   giao dịch permissionless `confirmTenderFunding`. Trong điều kiện Sepolia/Nox
   bình thường bước `FundingPending → Open` mất khoảng 25–30 giây.
7. Với Safe 1/1 đã execute, kiểm tra toast thành công và tender chuyển sang
   `Open`; chi tiết transaction được thu gọn vào `TRANSACTION HISTORY`, không
   hiện khối calldata sau tác vụ thành công. Mục lịch sử hiển thị cả Safe
   transaction hash và execution transaction trên Etherscan.
8. Với multisig chưa đủ chữ ký, handoff đang chờ mới hiển thị threshold progress,
   `REFRESH SIGNATURES`, `COPY BATCH JSON` và `OPEN SAFE` để tiếp tục/phục hồi.
9. Nếu là multisig, proposal chưa đủ chữ ký xuất hiện trong
   `PENDING APPROVALS` và tự refresh trạng thái. Với Safe 1/1, action đã execute
   chuyển vào `TRANSACTION HISTORY` thu gọn. Browser chỉ lưu Safe address, Safe
   transaction hash, loại action và timestamp công khai; không lưu handle,
   proof, chữ ký, recipient, amount hoặc plaintext.
10. Ghi lại Tender ID từ `PUBLIC` sau khi transaction được index. Nếu browser
    đóng, ví từ chối hoặc proof tạm thời chưa có, Activity checkpoint và relay
    sẽ tiếp tục làm fallback; không tạo lại tender.

Kết quả mong đợi:

- Preparation và tạo tender nằm trong cùng một Safe transaction nguyên tử.
- Chỉ Safe transaction đạt threshold mới có thể chuyển confidential budget.
- Tender chỉ mở sau khi exact funding được chứng minh.
- Buyer của tender là địa chỉ Safe đã chọn, không phải EOA owner.
- Review wallet là EOA owner đang kết nối và đã được Safe threshold chấp thuận
  trong chính calldata tạo tender.
- Public ceiling là `10 vUSDC`.
- Hai địa chỉ Vendor là metadata công khai.
- Safe owner không tự động thấy plaintext bid của Vendor.
- Relay không nhận plaintext balance. Browser chỉ giữ balance Safe đã reveal
  trong state của phiên hiện tại để kiểm tra ceiling; handle/proof không được
  lưu vào checkpoint.

## 5. Vendor 1 gửi bid

1. Chuyển MetaMask sang Vendor 1:

```text
0x82342063DdfC86fC91333c31E2Ab65b4d6B34A55
```

2. Mở workspace `PRIVATE BIDS`, chọn tab `SUBMIT BID`.
3. Chọn tender vừa tạo. Dropdown chỉ liệt kê tender `Open` còn hạn và được
   approve cho ví hiện tại, hiển thị
   giờ local của máy, countdown và thời gian UTC on-chain. Tender hết hạn phải
   tự biến mất và không được encrypt/simulate.
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

2. Mở workspace `PRIVATE BIDS`, chọn tab `SUBMIT BID`.
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

## 7. Test review wallet tự động

Review wallet của tender Safe là EOA owner đã được bind ở lúc tạo. Không có nút
Buyer grant thủ công và không cần thêm Safe proposal.

1. Khi tender vẫn `Open`, chuyển về Safe owner.
2. Mở workspace `PRIVATE BIDS`, chọn tab `GRANTED ACCESS` và chờ web tự kiểm
   tra ACL của các bid đã index.
3. Xác nhận danh sách chưa hiện bid của Vendor 2 vì review wallet chưa được
   phép reveal bid đó.
4. Hoàn tất bước relay/finalize tại mục 8.
5. Khi tender đã `Awarded` hoặc `Refunded`, vẫn bằng Safe owner, mở lại
   `GRANTED ACCESS` và chọn đúng bid vừa tự động xuất hiện.
6. Bấm `REVEAL IN SESSION`; không có bước kiểm tra quyền thủ công riêng.
7. Đổi tài khoản hoặc reload và xác nhận plaintext bị xóa.

Không chụp hoặc lưu giá reveal vào public evidence. Quyền review chỉ áp dụng
cho các bid handle của tender đã finalize; không cấp token operator, Buyer,
Vendor, Safe signer hoặc protocol admin. Vendor vẫn có thể chủ động share bid
của chính mình nếu có nhu cầu riêng.

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

### Activity & History: lịch sử và phục hồi

1. Mở workspace `ACTIVITY`.
2. Xem `LIFECYCLE HISTORY` để theo dõi toàn bộ public event đã index của tender
   (tạo, funding, bid received, close, award/refund/cancel và viewer grant),
   block cùng transaction tương ứng. Các giá trị bid và balance confidential
   không xuất hiện ở đây.
3. Kiểm tra phần `RECOVERABLE CHECKPOINTS`. Nếu một thao tác browser trước đó
   bị gián đoạn, kết nối đúng ví và bấm `RESUME`.
4. Nếu relay chưa close/finalize sau một khoảng chờ hợp lý, kết nối một ví có
   Sepolia ETH và xem `MANUAL RELAY FALLBACK`.
5. Với tender đang `Open` và đã đủ điều kiện, bấm `CLOSE & TRACK`.
6. Với tender đã `Closed`, bấm `TRACK PROOF`.
7. Xác nhận transaction cần thiết trong MetaMask.
8. Nếu proof chưa sẵn sàng, checkpoint vẫn phải còn trong
   `RECOVERABLE CHECKPOINTS`; thử `RESUME` sau, không tạo tender mới.
9. Sang `PUBLIC` và refresh trạng thái.

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

## 10. EOA Buyer — luồng ví trực tiếp

Mở workspace `BUYER`, chọn tab `EOA BUYER`; luồng này tạo tender do ví cá nhân
sở hữu, không cần Safe.

1. Kết nối EOA trên Sepolia.
2. Bảo đảm EOA có Sepolia ETH và đủ public Test USDC. Nếu thiếu, người dùng phải
   tự bấm `GET TEST USDC`; Create Tender không tự gọi faucet.
3. Nhập public metadata, ceiling, deadline và 1–8 Vendor.
4. Bấm `CREATE WITH EOA`.
5. Xác nhận lần lượt các transaction cần thiết:
   - Chặn trước giao dịch nếu public ceiling lớn hơn Test USDC hiện có.
   - Approve wrapper.
   - Wrap sang confidential vcUSDC.
   - Authorize Market operator.
   - Create và fund tender.
6. Khi tender được tạo, chờ browser lấy exact-funding proof rồi xác nhận giao
   dịch `confirmTenderFunding`; tender chuyển sang `Open` ngay trong luồng.
7. Nếu đóng tab, từ chối chữ ký hoặc proof tạm thời chưa sẵn sàng, relay sẽ làm
   fallback. Có thể mở `ACTIVITY` để resume checkpoint funding tương ứng.

Kết quả mong đợi:

- Tender Buyer là EOA đang kết nối.
- Tender vẫn phải đi qua `FundingPending` trước khi `Open`.
- EOA Buyer không được cung cấp winner và không tự động xem bid khi tender đang
  mở.
- EOA Buyer được bind làm review wallet và tự nhận per-bid ACL sau finalization.
- Luồng này được hỗ trợ đầy đủ; video submission vẫn có thể ưu tiên Safe Buyer
  để giữ đúng định vị “Confidential procurement for Safe treasuries”.

## 11. Kiểm tra lỗi và session

Thực hiện thêm các trường hợp:

1. Chuyển MetaMask sang mạng khác: write actions phải bị vô hiệu hóa và có
   hướng dẫn chuyển lại Sepolia.
2. Từ chối một wallet prompt: toast phải đổi sang lỗi, không treo loading.
3. Nhập wrap amount lớn hơn Test USDC: UI phải báo lỗi trước khi gửi.
4. Nhập EOA public ceiling lớn hơn Test USDC hiện có: Create Tender phải yêu
   cầu người dùng tự bấm faucet và không tự gửi giao dịch faucet.
5. Nhập bid lớn hơn public ceiling: UI phải từ chối.
6. Dùng ví không được approve để gửi bid: giao dịch không được tiếp tục.
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
- [ ] Ví kết nối deposit vcUSDC thẳng vào Safe thành công.
- [ ] Optional: faucet/manual wrap của EOA hoạt động.
- [ ] Optional: EOA vcUSDC reveal chỉ tồn tại trong session.
- [ ] Safe Buyer tạo atomic preparation/create batch thành công.
- [ ] Safe transaction đạt threshold và được execute trên Sepolia.
- [ ] Web confirm exact funding thành công; relay/Activity fallback vẫn hoạt động.
- [ ] Tender chuyển sang `Open`.
- [ ] Hai Vendor gửi hai bid mã hóa.
- [ ] Public hiển thị `2 / 2` Vendor đã bid và không lộ giá.
- [ ] Review wallet bị từ chối khi Open và tự có ACL sau finalization.
- [ ] Private Bids check ACL và reveal đúng bid trong session.
- [ ] Relay close sớm khi đủ Vendor và finalize proof thành công.
- [ ] Optional: Activity manual fallback/checkpoint recovery hoạt động.
- [ ] Vendor 2 thắng với bid thấp nhất.
- [ ] Award receipt được tạo.
- [ ] Toast hiển thị đúng từng giai đoạn và không bị treo.
- [ ] Module preparation không có quyền tự execute từ Safe.
- [ ] Safe owner EOA không thay thế Buyer Safe hoặc vượt qua threshold.
- [ ] Không có private key, plaintext bid, confidential balance, handle hoặc
      proof trong log/evidence.
