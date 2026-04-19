# 🇮🇳 IndiaStats CMS

**IndiaStats CMS** is a powerful, open-source election data and statistics management system. Built with **Payload CMS** and **Next.js**, it provides a robust platform for visualizing Indian election trends, voter statistics, and constituency-level insights with precision and clarity.

---

### 🌟 Support the Project
If you find this project useful or interesting, please consider giving it a **Star** on GitHub! It helps open-source lovers find the project and motivates us to keep improving it.

[![GitHub stars](https://img.shields.io/github/stars/dculussoftwares/indiastats-cms?style=social)](https://github.com/dculussoftwares/indiastats-cms)

---

## 🚀 Key Features

- **🗳️ Comprehensive Election Data**: Manage and visualize data for Assemblies, Districts, States, and Polling Booths.
- **📊 Interactive Dashboards**: Real-time visualization of election results, voter turnouts, and historical trends.
- **🗺️ Interactive Maps**: Built-in support for Leaflet maps to visualize constituency boundaries and geographic data.
- **👥 Demographic Insights**: Detailed analysis of caste demographics and voter distributions.
- **🖼️ Dynamic OG Images**: Automatically generated social sharing images for every constituency and district.
- **📈 Advanced Analytics**: Integrated with Mixpanel, PostHog, and Microsoft Clarity for deep user behavior insights.
- **📱 Responsive & Fast**: Optimized with Next.js for high performance and a seamless mobile-first experience.
- **📁 Data Portability**: Import/Export election data via Excel/XLSX.

## 🛠️ Tech Stack

- **Backend**: [Payload CMS](https://payloadcms.com/) (PostgreSQL + Azure Storage)
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), TailwindCSS, Shadcn/UI
- **Visualizations**: [Recharts](https://recharts.org/), [Leaflet](https://leafletjs.com/)
- **Video Rendering**: [Remotion](https://www.remotion.dev/)
- **Analytics**: Mixpanel, PostHog, Microsoft Clarity
- **Infrastructure**: Docker, Terraform, Azure

## 🏁 Quick Start

### Prerequisites

- Node.js (v18.20.2 or higher)
- pnpm (v9 or v10)
- PostgreSQL database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dculussoftwares/indiastats-cms.git
   cd indiastats-cms
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment**:
   Copy the example environment file and fill in your credentials.
   ```bash
   cp .env.example .env
   ```

4. **Development**:
   ```bash
   pnpm dev
   ```

Open `http://localhost:3000` to see the application.

## 🤝 Contributing

We welcome contributions from the open-source community! Whether it's fixing bugs, adding new features, or improving documentation, your help is appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Dculus Softwares](https://github.com/dculussoftwares)
