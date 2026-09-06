package constants

const (
	EKYC_SOURCE_SUPERAPP     = "superapp"
	EKYC_PROVIDER_BACKOFFICE = "backoffice"
	EKYC_PROVIDER_PRIVY      = "privy"
)

var MapErrorEkycPrivy = map[string]string{
	"RC01": "Pastikan NIK pada KTP Anda jelas dan mudah dibaca. Coba ambil foto KTP Anda lagi dengan pencahayaan yang baik.",
	"RC02": "Pastikan nama pada KTP Anda jelas dan mudah dibaca. Coba ambil foto KTP Anda lagi dengan pencahayaan yang baik.",
	"RC03": "Pastikan tanggal lahir pada KTP Anda jelas dan mudah dibaca. Coba ambil foto KTP Anda lagi dengan pencahayaan yang baik.",
	"RC04": "Pastikan foto wajah Anda pada selfie sesuai dengan foto pada KTP. Coba ambil selfie Anda lagi dengan posisi wajah yang sama.",
	"RC05": "Pastikan foto wajah pada KTP Anda jelas dan mudah dilihat. Coba ambil foto KTP Anda lagi dengan pencahayaan yang baik.",
	"RC06": "Pastikan Anda mengunggah foto selfie yang benar. Coba ambil dan kirim ulang foto selfie Anda.",
	"RC07": "Pastikan Anda mengunggah foto KTP yang benar. Coba ambil dan kirim ulang foto KTP Anda.",
	"RC09": "Nomor HP Anda sudah digunakan di akun Privy yang lain. Silakan menggunakan nomor HP yang lain.",
	"RC11": "Anda telah mencapai batas maksimum permintaan OTP. Silakan coba lagi nanti.",
	"RC12": "Nama pada E-KTP Anda tidak sesuai dengan nama yang terdaftar. Pastikan Anda menggunakan nama yang sama.",
	"RC13": "Nama pada resi E-KTP Anda tidak sesuai dengan nama yang terdaftar. Pastikan Anda menggunakan nama yang sama.",
	"RC14": "Pastikan Anda mengunggah resi E-KTP asli, bukan fotokopi.",
	"RC15": "Pastikan Anda mengambil foto diri Anda bersama resi E-KTP.",
	"RC16": "Resi E-KTP Anda telah kedaluwarsa. Silakan perbarui dokumen Anda.",
	"RC17": "Data NIK, nama, dan tanggal lahir Anda tidak dapat divalidasi. Pastikan data Anda benar.",
	"RC18": "Email Anda sudah digunakan di akun Privy yang lain. Silakan menggunakan Email yang lain.",
	"RC19": "Link pendaftaran Anda telah kedaluwarsa. Silakan daftar ulang.",
	"RC26": "NIK pada E-KTP/KTP/resi E-KTP Anda berbeda dengan NIK yang terdaftar. Pastikan Anda menggunakan NIK yang sama.",
	"RC27": "Tanggal lahir pada E-KTP/KTP/resi E-KTP Anda berbeda dengan tanggal lahir yang terdaftar. Pastikan Anda menggunakan tanggal lahir yang sama.",
	"RC28": "Pastikan email yang Anda masukkan benar dan menggunakan domain email yang valid (contoh: http://yahoo.com/, http://gmail.com/, http://rocketmail.com/). [d]",
	"RC29": "Pastikan Anda mengambil foto identitas Anda secara langsung, bukan dari layar atau fotokopi. [d]",
	"RC32": "Pastikan nomor telpon yang Anda gunakan sudah sesuai.",
	"RC33": "Pastikan email yang Anda masukkan benar dan menggunakan domain email yang valid (contoh: yahoo.com, gmail.com, rocketmail.com).",
}
