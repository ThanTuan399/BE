const API_URL = "http://localhost:5000/api";

// 1. QUẢN LÝ ĐIỀU HƯỚNG TRANG & MODAL
const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const modal = document.getElementById("modal");

const pageInfo = {
  dashboard: { title: "Tổng quan", description: "Chào mừng bạn quay trở lại hệ thống." },
  appointments: { title: "Lịch khám", description: "Theo dõi và quản lý lịch khám bệnh nhân." },
  patients: { title: "Bệnh nhân", description: "Quản lý thông tin và hồ sơ bệnh nhân." },
  doctors: { title: "Bác sĩ", description: "Quản lý đội ngũ bác sĩ và lịch làm việc." }
};

function showPage(pageId) {
  pages.forEach(p => p.classList.remove("active-page"));
  menuItems.forEach(i => i.classList.remove("active"));

  const targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.add("active-page");

  menuItems.forEach(item => {
    if (item.dataset.page === pageId) item.classList.add("active");
  });

  if (pageInfo[pageId]) {
    pageTitle.textContent = pageInfo[pageId].title;
    pageDescription.textContent = pageInfo[pageId].description;
  }

  // Tải dữ liệu tương ứng theo trang
  if (pageId === 'dashboard') loadDashboardStats();
  if (pageId === 'appointments') loadAppointments();
  if (pageId === 'doctors' || pageId === 'patients') loadUsers();
}

menuItems.forEach(item => {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    if (this.dataset.page) showPage(this.dataset.page);
  });
});

function openModal() {
  modal.classList.add("show");
  loadDoctorsForModal(); // Load danh sách bác sĩ vào dropdown
}

function closeModal() {
  modal.classList.remove("show");
}

// 2. TẢI DỮ LIỆU THỐNG KÊ DASHBOARD (API ADMIN)
async function loadDashboardStats() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/admin/thong-ke`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    if (res.ok && result.data) {
      const { tongQuan } = result.data;
      // Cập nhật số liệu lên Stat Cards
      const statCards = document.querySelectorAll(".stat-card h3");
      if (statCards.length >= 3) {
        statCards[0].textContent = tongQuan.tongSoLuotKham || 0;
        statCards[1].textContent = tongQuan.tongSoBenhNhan || 0;
        statCards[2].textContent = tongQuan.tongSoBacSi || 0;
      }
    }
  } catch (err) {
    console.error("Lỗi tải thống kê:", err);
  }
}

// 3. TẢI DANH SÁCH LỊCH KHÁM
async function loadAppointments() {
  const token = localStorage.getItem("token");
  const tbody = document.querySelector("#appointments table tbody");
  if (!tbody) return;

  try {
    const res = await fetch(`${API_URL}/admin/lich-kham`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();

    if (res.ok && Array.isArray(result.data)) {
      tbody.innerHTML = result.data.map(item => `
        <tr>
          <td>
            <strong>${new Date(item.thoiGianBatDau).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong><br>
            <small>${new Date(item.thoiGianBatDau).toLocaleDateString('vi-VN')}</small>
          </td>
          <td>${item.benhNhanId?.hoTen || 'Khách'}</td>
          <td>${item.bacSiId?.hoTen || 'Chưa gán'}</td>
          <td>Chuyên khoa</td>
          <td>
            <span class="status ${item.trangThai === 'Hoàn thành' ? 'completed' : item.trangThai === 'Đã hủy' ? 'cancelled' : 'waiting'}">
              ${item.trangThai}
            </span>
          </td>
          <td><button class="more">•••</button></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error("Lỗi tải lịch khám:", err);
  }
}

// 4. LOAD BÁC SĨ VÀO DROPDOWN KHI ĐẶT LỊCH
async function loadDoctorsForModal() {
  const doctorSelect = document.querySelector("#appointmentForm select:nth-of-type(2)");
  const token = localStorage.getItem("token");
  if (!doctorSelect) return;

  try {
    const res = await fetch(`${API_URL}/admin/nguoi-dung`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();

    if (res.ok && result.data?.bacSi) {
      doctorSelect.innerHTML = `<option value="">-- Chọn bác sĩ --</option>` +
        result.data.bacSi.map(bs => `<option value="${bs._id}">${bs.hoTen} - ${bs.soDienThoai || ''}</option>`).join('');
    }
  } catch (err) {
    console.error("Lỗi tải danh sách Bác sĩ:", err);
  }
}

// 5. XỬ LÝ ĐẶT LỊCH KHÁM MỚI (POST /api/public/dat-lich)
const appointmentForm = document.getElementById("appointmentForm");
if (appointmentForm) {
  appointmentForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const inputs = this.querySelectorAll("input, select, textarea");
    const hoTen = inputs[0]?.value || "Bệnh nhân mới";
    const bacSiId = inputs[1]?.value;
    const ngayKham = inputs[2]?.value;
    const gioKham = inputs[3]?.value;

    if (!bacSiId || !ngayKham || !gioKham) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const thoiGianBatDau = new Date(`${ngayKham}T${gioKham}:00`).toISOString();
    const thoiGianKetThuc = new Date(new Date(thoiGianBatDau).getTime() + 30 * 60000).toISOString();

    try {
      const res = await fetch(`${API_URL}/public/dat-lich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoTen,
          soDienThoai: "0988888888",
          bacSiId,
          thoiGianBatDau,
          thoiGianKetThuc
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert("Tạo lịch khám thành công!");
        closeModal();
        this.reset();
        loadAppointments();
      } else {
        alert(result.message || "Tạo lịch khám thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối tới Server Backend!");
    }
  });
}

// Tự động tải dữ liệu ban đầu
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
});