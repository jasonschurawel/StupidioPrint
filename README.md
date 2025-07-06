# StupidoPrint 🖨️

**The Simple Printing Solution for Everyone**

StupidoPrint eliminates the frustration of printer settings and complicated software. Designed for people who just want to print documents without dealing with technical complexities, driver issues, or confusing interfaces.

## 🎯 Who This Is For

- **Office Workers** who need a simple "drag and print" solution
- **Seniors** who find modern printer software too complicated
- **Students** who just want to print their assignments quickly
- **Small Businesses** that need a reliable kiosk-style printing station
- **Libraries & Print Shops** offering self-service printing
- **Anyone** frustrated with traditional printer software

## 🚀 Deployment Options

### Option 1: Kiosk Setup (Next to Printer)
Perfect for libraries, offices, or print shops where people need direct access to printing.

```bash
make show
```

Additional config (Autostart, ...) depends on your specific kiosk setup.

The interface will be available at `http://localhost:4173` - bookmark this in your browser or set it as the homepage.

### Option 2: Network Hosting (LAN Access)
Host it on one computer and let everyone in your office/network access it from their devices.

```bash
make run
```

Everyone can then access it at `http://[your-computer-ip]:4173` from any device on the network. (Currently ignoring Host setup)

## ✨ What Makes It Simple

- **No Driver Installation**: Uses your existing printer setup
- **Drag & Drop**: Just drag files into the website
- **Visual Preview**: See exactly what will print before printing
- **Smart Defaults**: Works great out of the box, no configuration needed for user
- **Universal Access**: Works on any device with a web browser
- **No Account Required**: Just open and use

## 📄 Supported Files

- **Documents**: PDF files
- **Images**: JPG, PNG, GIF, BMP, WebP
- **Multiple Files**: Print several documents at once

## 🖱️ How to use if it is hosted in your LAN

1. **Open the application** in your web browser
2. **Drag your files** into the window (or click to browse)
3. **Preview** how they'll look when printed
4. **Adjust if needed** (size, rotation, copies, duplex)
5. **Click Print** - done!

No accounts to create, no software to install on user devices, no technical knowledge required.

## ⚙️ Admin Setup (One-Time Only)

### Prerequisites
- Linux computer with CUPS printer system
- Printer connected and working with the system
- Node.js 18+ installed

### Quick Installation
```bash
# Download and setup
git clone https://github.com/[your-username]/StupidoPrint.git
cd StupidoPrint

# Auto-configure printer (detects available printers)
chmod +x config_printer.sh
./config_printer.sh

# Install and start
make install
make run
```

Then share the URL `http://[your-ip]:4173` with users.

## 🔧 Configuration Options

### Print Settings Users Can Control
- **Paper Size**: A4, A3, Letter, Legal
- **Quality**: Draft (fast), Normal, High (best quality)
- **Color Mode**: Color, Grayscale, Black & White
- **Duplex Printing**: 
  - Single-sided
  - Double-sided (horizontal flip)
  - Double-sided (vertical flip)
- **Copies**: 1-10 copies
- **Layout**: Multiple pages per sheet (1, 2, 4, 6, 8, 9, 12, 16)

=> Change the Code if you want to allow users different settings

### Advanced Adjustments
- **Scaling**: 10% - 200% size adjustment
- **Rotation**: 0°, 90°, 180°, 270°
- **Page Selection**: Print all pages or specific ranges
- **Multi-page Layout**: Fit multiple document pages on one printed sheet


## 🆘 Troubleshooting

### "Printer Not Found"
```bash
# Re-run the configuration script
./config_printer.sh
```

### "Cannot Access from Other Computers"
- Make sure firewall allows ports 3001 and 4173
- Check if your Computer ports are not blocked by firewall...
- Check that other computers are on the same network

### "Files Won't Upload"
- Check file size (default limit: 50MB per file)
- Verify file type is supported
- Try refreshing the browser

### "Print Jobs Not Working"
- Verify printer is turned on and has paper/ink
- Check CUPS printer status: `lpstat -p`
- Re-run printer configuration: `./config_printer.sh`

---

## 💡 Why "StupidoPrint"?

The name reflects our philosophy: printing should be so simple that you don't need to be technically smart to use it. We handle all the complicated stuff so users can focus on what matters - getting their documents printed quickly and easily.

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for everyone who's ever struggled with printer software
- Inspired by the need for accessible technology
- Special thanks to libraries, schools, and offices that need simple solutions

**Perfect for**: Offices, Libraries, Schools, Print Shops, Senior Centers, or anywhere people need hassle-free printing.