"use client";

import { useEffect, useState, useMemo } from "react";

interface Student {
  id: number;
  nrp: string;
  name: string;
  username: string;
  max_sks: number;
}

interface Course {
  id: number;
  code: string;
  name: string;
  sks: number;
  quota: number;
}

interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  course: Course;
  created_at?: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

export default function FRSPage() {
  // State Autentikasi
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // State FRS
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalSKS, setTotalSKS] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toast, setToast] = useState<Toast | null>(null);

  const maxSKS = currentUser?.max_sks || 24;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Cek apakah user sudah login sebelumnya di browser ini
  useEffect(() => {
    const savedUser = localStorage.getItem("frs_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem("frs_user");
      }
    }
    setLoading(false);
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Gagal memuat mata kuliah:", err);
    }
  };

  const loadFRS = async (studentId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/frs/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
        setTotalSKS(data.total_sks || 0);
      }
    } catch (err) {
      console.error("Gagal memuat FRS:", err);
    }
  };

  // Muat data jika user sudah login
  useEffect(() => {
    if (currentUser) {
      loadCourses();
      loadFRS(currentUser.id);
    }
  }, [currentUser]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Gagal masuk");
        return;
      }

      setCurrentUser(data.student);
      localStorage.setItem("frs_user", JSON.stringify(data.student));
      showToast("Selamat datang kembali!", "success");
    } catch (err) {
      setAuthError("Gagal terhubung ke server backend.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("frs_user");
    setEnrollments([]);
    setTotalSKS(0);
    setUsernameInput("");
    setPasswordInput("");
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const handleEnroll = async (course: Course) => {
    if (!currentUser) return;

    if (totalSKS + course.sks > maxSKS) {
      showToast(`Gagal: Pengambilan melebihi batas maksimal ${maxSKS} SKS!`, "error");
      return;
    }

    setProcessingId(course.id);
    try {
      const res = await fetch("http://localhost:8080/api/frs/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: currentUser.id,
          course_id: course.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gagal mengambil mata kuliah", "error");
        return;
      }

      showToast(`Mata kuliah ${course.name} berhasil ditambahkan!`, "success");
      await loadFRS(currentUser.id);
    } catch (err) {
      showToast("Gagal terhubung ke server backend", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDrop = async (enrollmentId: number, courseName: string) => {
    if (!currentUser) return;

    setProcessingId(enrollmentId);
    try {
      const res = await fetch(`http://localhost:8080/api/frs/${enrollmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`${courseName} berhasil dibatalkan.`, "success");
        await loadFRS(currentUser.id);
      } else {
        showToast("Gagal membatalkan mata kuliah", "error");
      }
    } catch (err) {
      showToast("Gagal terhubung ke server backend", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const isEnrolled = (courseId: number) => {
    return enrollments.some((item) => item.course_id === courseId);
  };

  const sksPercentage = Math.min((totalSKS / maxSKS) * 100, 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // JIKA BELUM LOGIN: TAMPILKAN FORM LOGIN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 space-y-6">
          <div className="text-center space-y-2">
            <img
              src="https://www.its.ac.id/wp-content/uploads/2020/06/Lambang-ITS.png"
              alt="Logo ITS"
              className="h-16 mx-auto object-contain mb-3"
            />
            <h1 className="text-xl font-bold text-slate-900">Portal FRS Mahasiswa</h1>
            <p className="text-xs text-slate-500">
              Silakan masuk menggunakan akun mahasiswa ITS
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username / NRP
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Contoh: garda atau 5025251133"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan password"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-sm text-slate-900 placeholder-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition flex items-center justify-center text-sm shadow-sm"
            >
              {authLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Masuk ke Portal FRS"
              )}
            </button>
          </form>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Akun Demo:</span>
            <br />
            Username: <code className="text-blue-700 font-bold">budi</code> | Password: <code className="text-blue-700 font-bold">123</code>
          </div>
        </div>
      </div>
    );
  }

  // JIKA SUDAH LOGIN: TAMPILKAN DASHBOARD FRS
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="bg-blue-950 text-white border-b border-blue-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://www.its.ac.id/wp-content/uploads/2020/06/Lambang-ITS.png"
              alt="Logo ITS"
              className="h-10 w-auto object-contain"
            />
            <div>
              <span className="font-bold tracking-tight text-base block leading-none">
                Sistem Rencana Studi Mahasiswa
              </span>
              <span className="text-xs text-blue-300 font-normal">
                Institut Teknologi Sepuluh Nopember
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded-md text-xs font-medium transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Cetak FRS
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-md text-xs font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        {/* Student Profile Card Dinamis */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg flex-shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-500">NRP:</span> {currentUser.nrp}</p>
                  <p><span className="font-semibold text-slate-500">Departemen:</span> Teknik Informatika</p>
                  <p><span className="font-semibold text-slate-500">Status:</span> Aktif</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">Beban Studi</span>
                <span className="text-slate-900">
                  <strong className="text-blue-700 text-sm">{totalSKS}</strong> / {maxSKS} SKS
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    sksPercentage > 85 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${sksPercentage}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 text-right">
                Tersisa {maxSKS - totalSKS} SKS untuk diambil
              </p>
            </div>
          </div>
        </section>

        {/* 2 Kolom: Katalog & FRS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Katalog */}
          <section className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Pilihan Mata Kuliah</h3>
                <p className="text-xs text-slate-500">Daftar kelas yang dibuka pada semester ini</p>
              </div>
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Cari matkul atau kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
                <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[580px] overflow-y-auto">
              {filteredCourses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Mata kuliah tidak ditemukan.
                </div>
              ) : (
                filteredCourses.map((c) => {
                  const enrolled = isEnrolled(c.id);
                  const isProcessing = processingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {c.code}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {c.sks} SKS
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm">{c.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          Kapasitas Kuota: <span className="font-medium text-slate-700">{c.quota} Mahasiswa</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleEnroll(c)}
                        disabled={enrolled || isProcessing}
                        className={`w-28 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
                          enrolled
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
                        }`}
                      >
                        {isProcessing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : enrolled ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Terambil
                          </>
                        ) : (
                          "+ Ambil"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Kolom Kanan: FRS Terdaftar */}
          <section className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Mata Kuliah Diambil</h3>
                <p className="text-xs text-slate-500">Daftar kelas yang terdaftar dalam FRS Anda</p>
              </div>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full">
                {enrollments.length} Mata Kuliah
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {enrollments.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-12 h-12 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-600">Belum ada mata kuliah yang diambil</p>
                  <p className="text-[11px] text-slate-400">Pilih dari katalog di sisi kiri untuk mulai menyusun FRS.</p>
                </div>
              ) : (
                enrollments.map((item) => {
                  const isProcessing = processingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-500 font-semibold">
                            {item.course?.code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            {item.course?.sks} SKS
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 text-xs leading-tight">
                          {item.course?.name}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDrop(item.id, item.course?.name)}
                        disabled={isProcessing}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1 border border-transparent hover:border-rose-200"
                      >
                        {isProcessing ? (
                          <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Drop
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {enrollments.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Total Beban Terdaftar:</span>
                <span className="font-bold text-blue-900 text-sm">{totalSKS} SKS</span>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}