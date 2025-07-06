# Contributing to StupidoPrint

Thank you for your interest in contributing to StupidoPrint! This project aims to make printing accessible to everyone, especially those who find technology challenging.

## 🎯 Project Philosophy

Before contributing, please understand our core principles:

- **Simplicity First**: Every feature should make printing easier, not more complex
- **Accessibility**: Design for users with limited technical knowledge - think of your sister ⁻^-^
- **Reliability**: The software should "just work" without configuration
- **Universal Design**: Consider users of all ages and technical abilities

## 🚀 Getting Started

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/jasonschurawel/StupidioPrint.git
   cd StupidoPrint
   ```

2. **Install Dependencies**
   ```bash
   make install
   ```

3. **Configure Printer** (for testing if your printer is even accesible)
   ```bash
   ./config_printer.sh
   ```

4. **Start Development Server**
   ```bash
   make run-dev
   ```

### Development Guidelines

- **Code Style**: Follow the existing TypeScript/React patterns
- **Testing**: Test with real printers when possible
- **Documentation**: Update README for user-facing changes

## 🐛 Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, printer model
- **Steps to Reproduce**: Clear, numbered steps
- **Expected vs Actual**: What should happen vs. what happens
- **Screenshots**: Especially helpful for UI issues
- **Log Output**: Include relevant console/server logs

## 💡 Feature Requests

Before suggesting features, consider:

- **Will this make printing simpler for non-technical users?**
- **Does this align with our "kiosk-friendly" philosophy?**
- **Can this be implemented without requiring user configuration?**

Good feature examples:
- Better visual feedback
- Support for more file types
- Improved error messages
- Accessibility improvements

## 📋 Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/description-of-change
   ```

2. **Make Your Changes**
   - Follow existing code style
   - Add comments for complex logic
   - Test with real scenarios

3. **Test Thoroughly**
   ```bash
   make clean
   make run
   ```

4. **Update Documentation**
   - Update README if needed
   - Add code comments
   - Document any new features

5. **Submit Pull Request**
   - Clear title and description
   - Reference any related issues
   - Include testing notes

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or improvement
- `documentation`: Documentation updates
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention needed
- `accessibility`: Accessibility improvements
- `kiosk`: Kiosk-mode specific issues

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Code Comments**: For implementation details

---

Remember: Every contribution helps make printing more accessible for someone who struggles with technology. Thank you for being part of this mission! 🖨️✨
