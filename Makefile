# StupidoPrint Makefile

.PHONY: help install build lint clean run run-dev config status stop show

# Default target
help:
	@echo "StupidoPrint - Available commands:"
	@echo ""
	@echo "  make install  - Install dependencies"
	@echo "  make build    - Lint and build the application"
	@echo "  make run      - Start the application in production mode"
	@echo "  make run-dev  - Start the application in development mode"
	@echo "  make stop     - Stop running servers"
	@echo "  make config   - Configure printer settings"
	@echo "  make status   - Show current configuration"
	@echo "  make show     - Open application in browser (starts server if needed)"
	@echo "  make clean    - Clean build artifacts and reset printer configuration"
	@echo "  make help     - Show this help"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	cd server && npm install

# Lint and build
build: lint
	@echo "Building application..."
	npm run build

# Clean build artifacts only (for building)
clean-build-files:
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf node_modules/.vite/

# Clean and build (fresh build)
clean-build: clean-build-files build
	@echo "Clean build completed."

# Lint the code
lint:
	@echo "Linting code..."
	@npm run lint

# Configure printer
config:
	@echo "Configuring printer..."
	./config_printer.sh setup

# Show configuration status
status:
	@echo "Checking printer configuration..."
	./config_printer.sh status

# Start the application in production mode
run:
	@if [ ! -d "dist" ]; then \
		echo "Build not found. Building application..."; \
		$(MAKE) clean-build; \
	else \
		echo "Build found. Checking if rebuild is needed..."; \
		if [ "src" -nt "dist" ] || [ "package.json" -nt "dist" ] || [ "vite.config.ts" -nt "dist" ]; then \
			echo "Source files newer than build. Rebuilding..."; \
			$(MAKE) clean-build; \
		else \
			echo "Build is up to date. Skipping build step."; \
		fi; \
	fi
	@if [ ! -f "$$HOME/.stupidoprint_config" ]; then \
		echo "No printer configuration found. Running initial setup..."; \
		./config_printer.sh setup; \
	else \
		echo "Printer configuration found. Press Ctrl+C within 10 seconds to reconfigure..."; \
		timeout 10 bash -c 'read -p "Press Enter to reconfigure printer or wait..." && ./config_printer.sh setup' || true; \
	fi
	@echo "Starting StupidoPrint application in production mode..."
	@echo "Stopping any existing servers..."
	@-pkill -f "npm.*start" 2>/dev/null || true
	@-pkill -f "npm.*dev" 2>/dev/null || true
	@-pkill -f "node.*server.js" 2>/dev/null || true
	@-pkill -f "vite.*preview" 2>/dev/null || true
	@sleep 2
	@echo "Starting print server..."
	@cd server && npm start &
	@sleep 3
	@echo "Starting production preview server..."
	@npm run preview &
	@sleep 3

# Start the application in development mode
run-dev:
	@if [ ! -f "$$HOME/.stupidoprint_config" ]; then \
		echo "No printer configuration found. Running initial setup..."; \
		./config_printer.sh setup; \
	else \
		echo "Printer configuration found. Press Ctrl+C within 10 seconds to reconfigure..."; \
		timeout 10 bash -c 'read -p "Press Enter to reconfigure printer or wait..." && ./config_printer.sh setup' || true; \
	fi
	@echo "Starting StupidoPrint application in development mode..."
	@echo "Stopping any existing servers..."
	@-pkill -f "npm.*start" 2>/dev/null || true
	@-pkill -f "npm.*dev" 2>/dev/null || true
	@-pkill -f "node.*server.js" 2>/dev/null || true
	@-pkill -f "vite.*preview" 2>/dev/null || true
	@sleep 2
	@echo "Starting print server..."
	@cd server && npm start &
	@sleep 3
	@echo "Starting React development server..."
	@npm run dev

# Open application in browser (starts server if needed)
show:
	@echo "Checking if production server is running..."
	@PROD_RUNNING=$$(curl -s http://localhost:4173 >/dev/null 2>&1 && echo "true" || echo "false"); \
	if [ "$$PROD_RUNNING" = "false" ]; then \
		echo "No server found. Starting production application..."; \
		$(MAKE) run; \
	else \
		echo "Server already running."; \
	fi
	@echo "Opening http://localhost:4173 in browser..."
	@xdg-open http://localhost:4173 2>/dev/null || \
	sensible-browser http://localhost:4173 2>/dev/null || \
	firefox http://localhost:4173 2>/dev/null || \
	google-chrome http://localhost:4173 2>/dev/null || \
	echo "Could not open browser automatically. Please visit: http://localhost:4173"

# Clean build artifacts and temporary files
clean: stop
	@echo "Cleaning build artifacts..."
	@rm -rf dist/
	@rm -rf node_modules/.vite/
	@rm -rf server/uploads/*
	@echo "Cleaning printer configuration..."
	@rm -f "$$HOME/.stupidoprint_config"
	@rm -f "public/stupidoprint_config.json"
	@echo "Cleaned build artifacts, temporary files, and printer configuration"

# Stop running servers
stop:
	@echo "Stopping StupidoPrint servers..."
	@echo "Terminating npm processes..."
	@-pkill -f "npm.*start" >/dev/null 2>&1 || true
	@-pkill -f "npm.*dev" >/dev/null 2>&1 || true
	@-pkill -f "npm.*preview" >/dev/null 2>&1 || true
	@-pkill -f "npm run dev" >/dev/null 2>&1 || true
	@-pkill -f "npm run preview" >/dev/null 2>&1 || true
	@echo "Terminating Vite processes..."
	@-pkill -f "vite.*preview" >/dev/null 2>&1 || true
	@-pkill -f "vite.*dev" >/dev/null 2>&1 || true
	@-pgrep -f "vite" | xargs -r kill >/dev/null 2>&1 || true
	@echo "Terminating Node.js processes..."
	@-pkill -f "node.*server.js" >/dev/null 2>&1 || true
	@-pkill -f "node.*dist/node" >/dev/null 2>&1 || true
	@echo "Terminating processes on ports 3001, 4173, 5173..."
	@-lsof -ti:3001 | xargs -r kill >/dev/null 2>&1 || true
	@-lsof -ti:4173 | xargs -r kill >/dev/null 2>&1 || true
	@-lsof -ti:5173 | xargs -r kill >/dev/null 2>&1 || true
	@sleep 2
	@echo "Force killing remaining processes if any..."
	@-pkill -9 -f "stupidoprint" >/dev/null 2>&1 || true
	@-pkill -9 -f "StupidoPrint" >/dev/null 2>&1 || true
	@echo "Cleaning up log files..."
	@-rm -f /tmp/stupidoprint_startup.log >/dev/null 2>&1 || true
	@echo "All StupidoPrint servers stopped"

# Deep clean (remove all dependencies)
clean-all: stop
	@echo "Removing all dependencies..."
	@rm -rf node_modules/
	@rm -rf server/node_modules/
	@rm -rf dist/
	@rm -rf node_modules/.vite/
	@rm -rf server/uploads/*
	@echo "Cleaning printer configuration..."
	@rm -f "$$HOME/.stupidoprint_config"
	@rm -f "public/stupidoprint_config.json"
	@echo "All dependencies and configurations removed"
