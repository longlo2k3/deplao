import { useEffect, useState } from 'react';

interface FeatureUseCase {
  label: string;
  detail: string;
}

interface Feature {
  id: string;
  orbitLabel: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  title: string;
  desc: string;
  badges: string[];
  useCases: FeatureUseCase[];
  dark?: boolean;
}

const featureGroups = [
  'Đa tài khoản Zalo',
  'Quản lý tin nhắn',
  'CRM & Khách hàng',
  'AI Assistant',
  'Workflow tự động',
  'Tích hợp bán hàng',
  'Báo cáo & Phân tích',
  'ERP quản trị công việc',
  'Nhân viên & workspace',
];

const features: Feature[] = [
  {
    id: 'multi-account',
    orbitLabel: 'Đa tài khoản',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-slate-900 to-blue-700',
    glow: 'rgba(29,78,216,0.24)',
    title: 'Đa tài khoản Zalo',
    desc: 'Quản lý nhiều tài khoản trong một nơi, chuyển đổi nhanh và theo dõi trạng thái theo thời gian thực.',
    badges: ['QR Login', 'Gộp trang', 'Realtime'],
    useCases: [
      { label: 'SME', detail: 'Theo dõi nhiều tài khoản Zalo cùng lúc trên một desktop app.' },
      { label: 'Agency', detail: 'Quản lý nhiều client mà không phải mở nhiều trình duyệt.' },
      { label: 'Team sales', detail: 'Boss nhìn được trạng thái online/offline của từng tài khoản.' },
      { label: 'CSKH đa page', detail: 'Chia ca trực và chuyển nhanh giữa các tài khoản mà không mất luồng xử lý.' },
    ],
  },
  {
    id: 'inbox',
    orbitLabel: 'Quản lý tin nhắn',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'from-blue-600 to-cyan-500',
    glow: 'rgba(59,130,246,0.24)',
    title: 'Quản lý tin nhắn',
    desc: 'Hộp thư tập trung cho chat, ảnh, file, sticker, quick reply và tìm kiếm hội thoại nhanh.',
    badges: ['Inbox', 'Quick reply', 'Search'],
    useCases: [
      { label: 'Shop online', detail: 'Xử lý hỏi giá, chốt đơn và trả lời khách nhanh hơn.' },
      { label: 'KOC / Creator', detail: 'Quản lý inbox follower và phản hồi FAQ bằng AI.' },
      { label: 'F&B', detail: 'Theo dõi khách quen, thông báo ưu đãi và nhắc quay lại.' },
      { label: 'Spa / Clinic', detail: 'Gom chat tư vấn, ảnh, file và lịch trao đổi trong một hộp thư duy nhất.' },
    ],
  },
  {
    id: 'crm',
    orbitLabel: 'CRM',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'from-emerald-600 to-teal-500',
    glow: 'rgba(5,150,105,0.22)',
    title: 'CRM & Khách hàng',
    desc: 'Đồng bộ bạn bè, thành viên nhóm, nhãn, note, sinh nhật và bộ lọc để chạy chiến dịch đúng tệp.',
    badges: ['Labels', 'Birthday', 'Campaign'],
    useCases: [
      { label: 'Quét nhóm', detail: 'Lấy thành viên nhóm ẩn hoặc nhóm chưa tham gia để tạo tệp khách.' },
      { label: 'Sinh nhật', detail: 'Lọc theo ngày sinh / giới tính để gửi chăm sóc cá nhân hoá.' },
      { label: 'Lead notes', detail: 'Lưu nhu cầu, lịch hẹn, lịch sử deal trong ghi chú nội bộ.' },
      { label: 'Phân tệp lead', detail: 'Nhóm khách theo nhãn, nguồn và mức độ quan tâm để chạy chiến dịch đúng đối tượng.' },
    ],
  },
  {
    id: 'ai',
    orbitLabel: 'AI',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.75h4.5m-6 3h7.5A2.25 2.25 0 0118 9v6a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 016 15V9a2.25 2.25 0 012.25-2.25zm-1.5 12.75h10.5" />
      </svg>
    ),
    color: 'from-violet-600 to-blue-500',
    glow: 'rgba(99,102,241,0.28)',
    title: ' AI Assistant',
    desc: 'Gợi ý phản hồi, phân loại nhu cầu, viết nội dung theo ngữ cảnh và hỗ trợ đội ngũ xử lý khách nhanh hơn ngay trong luồng chat.',
    badges: ['AI reply', 'Phân loại', 'Gợi ý nội dung'],
    useCases: [
      { label: 'Shop online', detail: 'AI đọc câu hỏi, gợi ý chốt đơn và đề xuất sản phẩm phù hợp.' },
      { label: 'Sales', detail: 'Tóm tắt hội thoại, nhắc bước tiếp theo và hỗ trợ follow-up lead.' },
      { label: 'CSKH', detail: 'Soạn phản hồi nhanh cho FAQ, khiếu nại và chăm sóc sau bán.' },
      { label: 'Marketing', detail: 'Viết nhanh nội dung tư vấn, upsell và biến thể câu trả lời theo từng tệp khách.' },
    ],
    dark: true,
  },
  {
    id: 'workflow',
    orbitLabel: 'Workflow',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'from-blue-700 to-indigo-600',
    glow: 'rgba(37,99,235,0.28)',
    title: 'Workflow tự động',
    desc: 'Dựng flow bằng trigger → logic → action, chạy nền 24/7 và kết hợp AI, Google Sheets, Telegram, HTTP request.',
    badges: ['Trigger', 'Logic', 'AI'],
    useCases: [
      { label: 'Follow-up', detail: 'Khách im lặng 4 giờ → tự nhắc lại và lưu log CRM.' },
      { label: 'Nhắc lịch', detail: 'Cron hàng ngày để gửi lịch học, lịch hẹn, thông báo nhóm.' },
      { label: 'Auto reply', detail: 'Nhận tin mới → AI phân loại → trả lời theo đúng ngữ cảnh.' },
      { label: 'Đơn hàng', detail: 'Thanh toán thành công → xác nhận đơn → báo nội bộ → cập nhật trạng thái tự động.' },
    ],
    dark: true,
  },
  {
    id: 'integration',
    orbitLabel: 'Tích hợp',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h18M6 12h12M9 17h6" />
      </svg>
    ),
    color: 'from-sky-600 to-blue-500',
    glow: 'rgba(14,165,233,0.22)',
    title: 'Tích hợp bán hàng',
    desc: 'Tra cứu đơn, tạo vận đơn, xác nhận thanh toán và đẩy dữ liệu ra ngoài mà không rời màn hình chat.',
    badges: ['POS', 'GHN/GHTK', 'Casso/SePay'],
    useCases: [
      { label: 'POS', detail: 'KiotViet, Haravan, Sapo, Nhanh và Pancake POS.' },
      { label: 'Thanh toán', detail: 'Webhook nhận tiền → xác nhận đơn → nhắn lại khách.' },
      { label: 'Vận chuyển', detail: 'Tạo vận đơn GHN/GHTK và tự báo trạng thái giao hàng.' },
      { label: 'Đồng bộ ngoài', detail: 'Đẩy dữ liệu đơn, khách hoặc trạng thái sang hệ thống khác mà không rời màn hình chat.' },
    ],
  },
  {
    id: 'analytics',
    orbitLabel: 'Báo cáo',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3v18h18M7 14l3-3 2 2 5-6" />
      </svg>
    ),
    color: 'from-cyan-600 to-blue-500',
    glow: 'rgba(6,182,212,0.22)',
    title: 'Báo cáo & Phân tích',
    desc: 'Tổng hợp các chỉ số vận hành quan trọng để team theo dõi hiệu suất chat, phản hồi khách và tăng trưởng dữ liệu theo thời gian.',
    badges: ['Dashboard', 'Hiệu suất', 'Lead'],
    useCases: [
      { label: 'Tin nhắn', detail: 'Đo số lượng tin nhắn vào/ra theo ngày, theo tài khoản hoặc theo từng nhân viên xử lý.' },
      { label: 'Phản hồi TB', detail: 'Theo dõi thời gian phản hồi trung bình để biết đội ngũ đang xử lý khách nhanh đến đâu.' },
      { label: 'Tăng trưởng liên hệ', detail: 'Xem số liên hệ mới tăng theo thời gian để đánh giá tốc độ mở rộng tệp khách hàng.' },
      { label: 'Campaign', detail: 'So sánh hiệu quả từng nhãn, chiến dịch và nhóm khách hàng để tối ưu vận hành.' },
    ],
  },
  {
    id: 'erp',
    orbitLabel: 'ERP',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 5.25h16.5v4.5H3.75zm0 7.5h7.5v6h-7.5zm10.5 0h6v2.25h-6zm0 4.5h6V19.5h-6z" />
      </svg>
    ),
    color: 'from-emerald-600 to-teal-500',
    glow: 'rgba(13,148,136,0.22)',
    title: 'ERP quản trị công việc',
    desc: 'Gom giao việc, trạng thái xử lý, nhắc việc và phối hợp vận hành nội bộ chung với chat, CRM và automation.',
    badges: ['Task', 'Nhắc việc', 'Điều phối'],
    useCases: [
      { label: 'Điều hành', detail: 'Giao đầu việc cho từng bộ phận và theo dõi tiến độ ngay trong app.' },
      { label: 'Vận hành', detail: 'Kết nối công việc nội bộ với trạng thái lead, đơn hàng và chăm sóc khách.' },
      { label: 'Nhắc việc', detail: 'Tự động nhắc việc đến hạn để giảm sót việc giữa các team.' },
      { label: 'Backoffice', detail: 'Gom xử lý nội bộ, checklist và các đầu việc lặp lại vào cùng một nơi.' },
    ],
  },
  {
    id: 'workspace',
    orbitLabel: 'Workspace',
    icon: (
      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-6m3 6V7m3 10v-3m3 3V4M6 20h12" />
      </svg>
    ),
    color: 'from-slate-900 to-indigo-600',
    glow: 'rgba(30,41,59,0.22)',
    title: 'Nhân viên & workspace',
    desc: 'Phân quyền theo vai trò, tách workspace, theo dõi người phụ trách và giúp team phối hợp trên cùng dữ liệu khách hàng.',
    badges: ['Permissions', 'Workspace', 'Phối hợp team'],
    useCases: [
      { label: 'Phân quyền', detail: 'Nhân viên chỉ thấy đúng tài khoản, module và thao tác được cấp.' },
      { label: 'Team flow', detail: 'Biết lead đang do ai phụ trách và chuyển giao nội bộ nhanh hơn.' },
      { label: 'Workspace', detail: 'Gom chat, CRM, AI và vận hành vào một không gian làm việc thống nhất.' },
      { label: 'Boss preview', detail: 'Quản lý xem nhanh từng vai trò làm việc ra sao mà không phá cấu trúc phân quyền.' },
    ],
  },
];

const orbitPositions = [
  { x: '16%', y: '16%', size: 'md', delay: '0s' },
  { x: '47%', y: '9%', size: 'sm', delay: '0.8s' },
  { x: '78%', y: '18%', size: 'md', delay: '1.4s' },
  { x: '10%', y: '46%', size: 'sm', delay: '1.1s' },
  { x: '32%', y: '74%', size: 'lg', delay: '0.4s' },
  { x: '82%', y: '48%', size: 'lg', delay: '1.8s' },
  { x: '54%', y: '86%', size: 'sm', delay: '2.2s' },
  { x: '14%', y: '84%', size: 'sm', delay: '2.6s' },
  { x: '86%', y: '80%', size: 'md', delay: '1.6s' },
] as const;

const Features: React.FC = () => {
  const [activeFeatureId, setActiveFeatureId] = useState<string>('workflow');
  const [isDetailHovered, setIsDetailHovered] = useState(false);
  const activeFeature = features.find((feature) => feature.id === activeFeatureId) ?? features[0];
  const activeFeatureIndex = features.findIndex((feature) => feature.id === activeFeature.id);

  const goToNextFeature = () => {
    const nextIndex = (activeFeatureIndex + 1) % features.length;
    setActiveFeatureId(features[nextIndex].id);
  };

  useEffect(() => {
    if (isDetailHovered) {
      return;
    }

    const timer = window.setTimeout(() => {
      goToNextFeature();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [activeFeatureIndex, isDetailHovered]);

  return (
    <section id="features" className="orbit-shell relative px-6 py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 xl:grid-cols-[0.8fr_1.2fr] xl:items-end">
          <div className="max-w-2xl">
            <div className="orbit-badge mb-4 aos-element">✨ Tính năng chính</div>
            <h2 className="aos-element delay-1 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Cách toàn bộ <span className="gradient-text">tính năng vận hành cùng nhau.</span>
            </h2>
            <p className="aos-element delay-2 mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              Giúp bạn nắm nhanh tổng quan các tính năng hệ thống, vai trò của từng phần và cách chúng phối hợp trong một quy trình thống nhất.            </p>
          </div>

          <div className="aos-element delay-2 flex flex-wrap gap-2.5 xl:justify-end">
            {featureGroups.map((group) => (
              <span key={group} className="planet-chip px-4 py-2 text-[12px]">
                {group}
              </span>
            ))}
          </div>
        </div>

        <div className="feature-galaxy-layout aos-element delay-3">
          <div className="feature-galaxy-map planet-card rounded-[2rem] p-5 md:p-6">
            <div className="feature-galaxy-canvas" aria-hidden="true">
              <span className="feature-orbit-ring feature-orbit-ring-1" />
              <span className="feature-orbit-ring feature-orbit-ring-2" />
              <span className="feature-orbit-ring feature-orbit-ring-3" />
              <span className="feature-galaxy-star feature-galaxy-star-1" />
              <span className="feature-galaxy-star feature-galaxy-star-2" />
              <span className="feature-galaxy-star feature-galaxy-star-3" />
              <span className="feature-galaxy-star feature-galaxy-star-4" />
            </div>

            <div className="feature-galaxy-hub">
              <div className="feature-galaxy-core">
                <div className="feature-galaxy-core-dot" />
                <div className="feature-galaxy-core-copy">
                  <strong>9 module cốt lõi</strong>
                  <span>Chọn một module để xem vai trò và use case tiêu biểu</span>
                </div>
              </div>
            </div>

            {features.map((feature, index) => {
              const orbit = orbitPositions[index];
              const isActive = activeFeature.id === feature.id;

              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-pressed={isActive}
                  aria-controls="feature-galaxy-detail-panel"
                  onClick={() => setActiveFeatureId(feature.id)}
                  className={`feature-planet feature-planet--${orbit.size} ${isActive ? 'is-active' : ''}`}
                  style={{
                    left: orbit.x,
                    top: orbit.y,
                    animationDelay: orbit.delay,
                  } as React.CSSProperties}
                >
                  <span
                    className={`feature-planet-sphere bg-gradient-to-br ${feature.color}`}
                    style={{
                      boxShadow: isActive
                        ? `0 0 0 12px rgba(191, 219, 254, 0.22), 0 24px 42px ${feature.glow}, inset -10px -12px 24px rgba(15, 23, 42, 0.14), inset 12px 14px 26px rgba(255, 255, 255, 0.22)`
                        : `0 0 0 10px rgba(191, 219, 254, 0.18), 0 18px 34px ${feature.glow}, inset -10px -12px 24px rgba(15, 23, 42, 0.16), inset 10px 12px 24px rgba(255, 255, 255, 0.18)`,
                    }}
                  >
                    <span className="feature-planet-icon">{feature.icon}</span>
                  </span>
                  <span className="feature-planet-name">{feature.orbitLabel}</span>
                  <span className="feature-planet-meta">{feature.badges[0]}</span>
                </button>
              );
            })}
          </div>

          <div
            id="feature-galaxy-detail-panel"
            className="feature-galaxy-detail command-panel rounded-[2rem] p-5 md:p-6"
            onMouseEnter={() => setIsDetailHovered(true)}
            onMouseLeave={() => setIsDetailHovered(false)}
          >
            <article key={activeFeature.id} className="feature-detail-panel feature-detail-panel-enter">
              <div className="feature-detail-topline mb-5 flex items-center justify-between gap-4">
                <div className="mini-kicker">
                  <span className="signal-dot" />
                  Module đang chọn
                </div>
                <div className="flex items-center gap-3">
                  <span className="feature-detail-index">{String(activeFeatureIndex + 1).padStart(2, '0')}</span>
                  <button type="button" onClick={goToNextFeature} className="feature-detail-next">
                    <span>Next</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-6 flex items-start justify-between gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br ${activeFeature.color} text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]`}>
                  {activeFeature.icon}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {activeFeature.badges.map((badge) => (
                    <span key={badge} className={`feature-detail-chip ${activeFeature.dark ? 'feature-detail-chip-active' : ''}`}>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6 max-w-2xl">
                <h3 className="mb-3 text-2xl font-black text-slate-950 md:text-3xl">{activeFeature.title}</h3>
                <p className="text-base leading-relaxed text-slate-600 md:text-lg">{activeFeature.desc}</p>
              </div>

              <div className="feature-detail-grid mb-6">
                {activeFeature.useCases.map((item) => (
                  <div key={item.label} className={`feature-detail-proof ${activeFeature.dark ? 'feature-detail-proof-active' : ''}`}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                    <div className="mt-2 text-sm leading-relaxed text-slate-700">{item.detail}</div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;

