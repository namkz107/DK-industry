# Mã hóa backup MongoDB bằng age

Backup production phải được mã hóa trước khi chuyển sang object storage, ổ đĩa
ngoài máy chủ hoặc bất kỳ nơi lưu trữ không đáng tin cậy. SHA-256 chỉ kiểm tra
tính toàn vẹn, không thay thế mã hóa.

## Chuẩn bị khóa

1. Cài `age` và MongoDB Database Tools từ nguồn chính thức.
2. Trên máy quản lý khóa tách biệt, chạy `age-keygen -o dk-industry-backup.agekey`.
3. Lưu private identity trong password manager hoặc secret vault có kiểm soát
   truy cập. Không đặt file này trên application server, trong repository,
   Docker image hoặc cùng nơi chứa backup.
4. Chỉ đưa public recipient dạng `age1...` vào `BACKUP_AGE_RECIPIENT` trên máy
   chạy backup.
5. Sao lưu private identity theo quy trình quản lý khóa của doanh nghiệp. Mất
   identity đồng nghĩa không thể khôi phục backup.

Không dán public/private key vào ticket, chat hoặc log. Public recipient không
giải mã được dữ liệu nhưng vẫn nên quản lý qua cấu hình vận hành.

## Tạo backup

```powershell
$env:BACKUP_AGE_RECIPIENT = "age1..."
npm run backup:db
```

Script tạo `*.archive.gz.age` và checksum `*.age.sha256`. Plaintext archive chỉ
tồn tại trong thư mục tạm trong lúc mã hóa và luôn được xóa ở khối `finally`.
Chỉ chuyển hai file đã mã hóa/checksum sang nơi lưu trữ offsite.

## Khôi phục thử nghiệm

Đặt private identity tạm thời trên máy restore được kiểm soát, ngoài repository:

```powershell
$env:BACKUP_AGE_IDENTITY_FILE = "D:\secure\dk-industry-backup.agekey"
.\scripts\restore-mongodb.ps1 `
  -Archive ".\backups\dk-industry-YYYYMMDD-HHMMSS.archive.gz.age" `
  -Uri "mongodb://127.0.0.1:27017/dk_industry_restore_test" `
  -SourceDatabase "dk_industry" `
  -TargetDatabase "dk_industry_restore_test"
```

Script xác minh checksum của ciphertext, giải mã vào file tạm, chỉ cho restore
vào database hậu tố `_test` theo mặc định và xóa file plaintext trong
`finally`. Sau diễn tập, xóa bản sao private identity khỏi máy restore và xác
minh không còn file archive plaintext trong thư mục tạm.

## Rotation và sự cố

- Khi đổi recipient, tạo backup mới cho recipient mới. Không xóa identity cũ
  cho tới khi toàn bộ backup theo retention cũ hết hạn hoặc đã được re-encrypt.
- Nếu nghi private identity bị lộ, ngừng tạo backup bằng recipient tương ứng,
  tạo cặp khóa mới, giới hạn quyền truy cập kho backup và đánh giá việc
  re-encrypt hoặc hủy an toàn các bản cũ.
- Restore drill phải ghi nhận ngày, người thực hiện, checksum, RPO/RTO và kết
  quả smoke test; không ghi URI có credentials hoặc nội dung private key.
