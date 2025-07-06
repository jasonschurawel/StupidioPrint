#!/bin/bash

# StupidoPrint - Interactive Printer Configuration Script
# This script guides you through configuring the printer for the application

# Configuration variables
DEFAULT_PRINTER=""
PRINT_QUALITY="normal"
PAPER_SIZE="A4"
COLOR_MODE="color"
CONFIG_FILE="$HOME/.stupidoprint_config"

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}===============================================${NC}"
    echo -e "${BLUE}          StupidoPrint Configuration${NC}"
    echo -e "${BLUE}===============================================${NC}\n"
}

# Function to check if CUPS is installed
check_cups() {
    if ! command -v lpstat &> /dev/null; then
        print_error "CUPS is not installed!"
        echo "Please install CUPS first:"
        echo "  Ubuntu/Debian: sudo apt-get install cups"
        echo "  CentOS/RHEL: sudo yum install cups"
        echo "  Arch: sudo pacman -S cups"
        exit 1
    fi
}

# Function to list available printers
list_printers() {
    print_info "Scanning for available printers..."
    local printers=$(lpstat -p 2>/dev/null | grep "printer" | cut -d' ' -f2)
    
    if [ -z "$printers" ]; then
        print_warning "No printers found!"
        echo "Make sure your printer is:"
        echo "  1. Connected and powered on"
        echo "  2. Added to CUPS (you can use system settings or: sudo system-config-printer)"
        echo "  3. Check CUPS web interface at: http://localhost:631"
        return 1
    fi
    
    echo "Available printers:"
    local i=1
    for printer in $printers; do
        local status=$(lpstat -p "$printer" 2>/dev/null | grep -o "enabled\|disabled")
        echo "  $i) $printer ($status)"
        ((i++))
    done
    echo "$printers"
}

# Function to interactive printer selection
select_printer() {
    local printers_output=$(list_printers)
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # Extract just the printer names from the output
    local printers=$(echo "$printers_output" | tail -n 1)
    local printer_array=($printers)
    local num_printers=${#printer_array[@]}
    
    if [ $num_printers -eq 0 ]; then
        return 1
    elif [ $num_printers -eq 1 ]; then
        DEFAULT_PRINTER="${printer_array[0]}"
        print_success "Only one printer found: $DEFAULT_PRINTER"
        return 0
    fi
    
    echo ""
    read -p "Select printer number (1-$num_printers): " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "$num_printers" ]; then
        DEFAULT_PRINTER="${printer_array[$((selection-1))]}"
        print_success "Selected printer: $DEFAULT_PRINTER"
        return 0
    else
        print_error "Invalid selection!"
        return 1
    fi
}

# Function to configure print settings interactively
configure_print_settings() {
    print_info "Configuring print settings for: $DEFAULT_PRINTER"
    
    # Paper size selection
    echo ""
    echo "Select paper size:"
    echo "  1) A4 (default)"
    echo "  2) A3"
    echo "  3) Letter"
    echo "  4) Legal"
    read -p "Choose paper size (1-4, default: 1): " paper_choice
    
    case $paper_choice in
        2) PAPER_SIZE="A3" ;;
        3) PAPER_SIZE="Letter" ;;
        4) PAPER_SIZE="Legal" ;;
        *) PAPER_SIZE="A4" ;;
    esac
    print_success "Paper size set to: $PAPER_SIZE"
    
    # Print quality selection
    echo ""
    echo "Select print quality:"
    echo "  1) Draft (fast, lower quality)"
    echo "  2) Normal (default)"
    echo "  3) High (slower, better quality)"
    read -p "Choose quality (1-3, default: 2): " quality_choice
    
    case $quality_choice in
        1) PRINT_QUALITY="draft" ;;
        3) PRINT_QUALITY="high" ;;
        *) PRINT_QUALITY="normal" ;;
    esac
    print_success "Print quality set to: $PRINT_QUALITY"
    
    # Color mode selection
    echo ""
    echo "Select color mode:"
    echo "  1) Color (default)"
    echo "  2) Grayscale"
    echo "  3) Monochrome (black & white)"
    read -p "Choose color mode (1-3, default: 1): " color_choice
    
    case $color_choice in
        2) COLOR_MODE="grayscale" ;;
        3) COLOR_MODE="monochrome" ;;
        *) COLOR_MODE="color" ;;
    esac
    print_success "Color mode set to: $COLOR_MODE"
}

# Function to apply settings to CUPS
apply_printer_settings() {
    print_info "Applying settings to CUPS..."
    
    # Set as default printer
    lpoptions -d "$DEFAULT_PRINTER" >/dev/null 2>&1
    
    # Apply printer-specific options
    lpoptions -p "$DEFAULT_PRINTER" -o print-quality="$PRINT_QUALITY" >/dev/null 2>&1
    lpoptions -p "$DEFAULT_PRINTER" -o media="$PAPER_SIZE" >/dev/null 2>&1
    lpoptions -p "$DEFAULT_PRINTER" -o print-color-mode="$COLOR_MODE" >/dev/null 2>&1
    
    print_success "Settings applied to CUPS"
}

# Function to save configuration
save_config() {
    print_info "Saving configuration..."
    
    # Save shell configuration
    cat > "$CONFIG_FILE" << EOF
# StupidoPrint Configuration
# Generated on $(date)
DEFAULT_PRINTER="$DEFAULT_PRINTER"
PRINT_QUALITY="$PRINT_QUALITY"
PAPER_SIZE="$PAPER_SIZE"
COLOR_MODE="$COLOR_MODE"
EOF
    chmod 600 "$CONFIG_FILE"
    
    # Save JSON configuration for web app
    local json_config="public/stupidoprint_config.json"
    cat > "$json_config" << EOF
{
  "DEFAULT_PRINTER": "$DEFAULT_PRINTER",
  "PRINT_QUALITY": "$PRINT_QUALITY",
  "PAPER_SIZE": "$PAPER_SIZE",
  "COLOR_MODE": "$COLOR_MODE",
  "configured_at": "$(date -Iseconds)"
}
EOF
    
    print_success "Configuration saved to: $CONFIG_FILE"
    print_success "Web app configuration saved to: $json_config"
}

# Function to load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        source "$CONFIG_FILE"
        print_success "Configuration loaded from: $CONFIG_FILE"
        return 0
    else
        print_info "No existing configuration found"
        return 1
    fi
}

# Function to display current configuration
show_config() {
    echo ""
    print_info "Current StupidoPrint Configuration:"
    echo "  Printer: ${DEFAULT_PRINTER:-'Not configured'}"
    echo "  Paper Size: $PAPER_SIZE"
    echo "  Print Quality: $PRINT_QUALITY"
    echo "  Color Mode: $COLOR_MODE"
    echo "  Config File: $CONFIG_FILE"
    echo ""
    
    if [ -n "$DEFAULT_PRINTER" ]; then
        print_info "Printer Status:"
        lpstat -p "$DEFAULT_PRINTER" 2>/dev/null || print_warning "Printer status unavailable"
    fi
}

# Function to print a file
print_file() {
    local file_path="$1"
    local second_arg="$2"
    local third_arg="$3"
    local fourth_arg="$4"
    
    # Determine argument format and extract printer name and duplex mode
    local printer_name="$DEFAULT_PRINTER"
    local duplex_mode=""
    
    if [ "$second_arg" = "duplex" ] || [ "$second_arg" = "duplex-horizontal" ] || [ "$second_arg" = "duplex-vertical" ]; then
        # Format: print file_path duplex[_mode]
        duplex_mode="$second_arg"
    elif [ -n "$second_arg" ] && [[ "$second_arg" != duplex* ]]; then
        # Format: print file_path printer_name [duplex]
        printer_name="$second_arg"
        if [[ "$third_arg" = duplex* ]]; then
            duplex_mode="$third_arg"
        fi
        # Also check if fourth arg is duplex (for server format: print file printer duplex)
        if [[ "$fourth_arg" = duplex* ]]; then
            duplex_mode="$fourth_arg"
        fi
    fi
    
    # Fallback: if printer_name is still empty, load from config
    if [ -z "$printer_name" ] || [ "$printer_name" = "default" ]; then
        printer_name="$DEFAULT_PRINTER"
        # If still empty, try to load config again
        if [ -z "$printer_name" ]; then
            load_config >/dev/null 2>&1
            printer_name="$DEFAULT_PRINTER"
        fi
        # Ultimate fallback
        if [ -z "$printer_name" ]; then
            printer_name="HP-OfficeJet-Pro-9120e-Series"
        fi
    fi
    
    if [ -z "$file_path" ]; then
        echo "Error: No file path provided"
        return 1
    fi
    
    if [ ! -f "$file_path" ]; then
        echo "Error: File not found: $file_path"
        return 1
    fi
    
    if [ -z "$printer_name" ]; then
        echo "Error: No printer configured"
        return 1
    fi
    
    echo "Printing file: $file_path"
    echo "Using printer: $printer_name"
    
    # Build the print command with options
    local print_options=""
    
    # Add duplex option if specified
    if [ "$duplex_mode" = "duplex-horizontal" ]; then
        print_options="$print_options -o sides=two-sided-long-edge"
        echo "Using duplex printing (two-sided, horizontal mirroring)"
    elif [ "$duplex_mode" = "duplex-vertical" ]; then
        print_options="$print_options -o sides=two-sided-short-edge"
        echo "Using duplex printing (two-sided, vertical mirroring)"
    else
        echo "Using single-sided printing"
    fi
    
    # Print the file with options
    if [ -n "$print_options" ]; then
        lp -d "$printer_name" $print_options "$file_path"
    else
        lp -d "$printer_name" "$file_path"
    fi
    
    if [ $? -eq 0 ]; then
        echo "Print job submitted successfully"
    else
        echo "Error: Print job failed"
        return 1
    fi
}

# Function to show printer status
show_status() {
    echo "Current printer configuration:"
    echo "  Default Printer: ${DEFAULT_PRINTER:-'Not set'}"
    echo "  Print Quality: $PRINT_QUALITY"
    echo "  Paper Size: $PAPER_SIZE"
    echo "  Color Mode: $COLOR_MODE"
    echo ""
    
    if [ -n "$DEFAULT_PRINTER" ]; then
        echo "Printer status:"
        lpstat -p "$DEFAULT_PRINTER" 2>/dev/null || echo "Printer status unavailable"
    fi
}

# Function to test print
test_print() {
    local printer_name="${1:-$DEFAULT_PRINTER}"
    
    if [ -z "$printer_name" ]; then
        echo "Error: No printer configured"
        return 1
    fi
    
    echo "Sending test page to: $printer_name"
    echo "StupidoPrint Test Page - $(date)" | lp -d "$printer_name"
    if [ $? -eq 0 ]; then
        echo "Test page sent successfully"
    else
        echo "Error: Failed to send test page"
        return 1
    fi
}

# Function to run interactive setup
interactive_setup() {
    print_header
    
    # Check CUPS
    check_cups
    
    # Show current configuration if it exists
    if [ -f "$CONFIG_FILE" ]; then
        echo ""
        print_info "Existing configuration found:"
        show_config
        echo ""
        read -p "Do you want to reconfigure? (y/N): " reconfigure
        if [[ ! "$reconfigure" =~ ^[Yy]$ ]]; then
            print_info "Using existing configuration."
            return 0
        fi
    fi
    
    # Select printer
    echo ""
    print_info "Step 1: Select Printer"
    if ! select_printer; then
        print_error "Printer selection failed!"
        return 1
    fi
    
    # Configure print settings
    echo ""
    print_info "Step 2: Configure Print Settings"
    configure_print_settings
    
    # Apply settings
    echo ""
    print_info "Step 3: Apply Settings"
    apply_printer_settings
    
    # Save configuration
    echo ""
    print_info "Step 4: Save Configuration"
    save_config
    
    # Show final configuration
    echo ""
    print_success "Configuration completed successfully!"
    show_config
    
    # Offer test print
    echo ""
    read -p "Would you like to send a test page? (y/N): " test_print_choice
    if [[ "$test_print_choice" =~ ^[Yy]$ ]]; then
        test_print
    fi
    
    print_success "Setup complete!"
    
    print_info "To start the application, run: make run"
}

# Function to set default printer manually
set_default_printer() {
    local printer_name="$1"
    
    if [ -z "$printer_name" ]; then
        print_error "Please specify a printer name"
        echo "Available printers:"
        list_printers
        return 1
    fi
    
    # Check if printer exists
    if ! lpstat -p "$printer_name" >/dev/null 2>&1; then
        print_error "Printer '$printer_name' not found"
        echo "Available printers:"
        list_printers
        return 1
    fi
    
    DEFAULT_PRINTER="$printer_name"
    lpoptions -d "$printer_name" >/dev/null 2>&1
    save_config
    print_success "Default printer set to: $printer_name"
}

# Function to configure printer options
configure_printer_options() {
    local printer_name="${1:-$DEFAULT_PRINTER}"
    
    if [ -z "$printer_name" ]; then
        print_error "No printer specified and no default printer configured"
        return 1
    fi
    
    DEFAULT_PRINTER="$printer_name"
    configure_print_settings
    apply_printer_settings
    save_config
    print_success "Printer options configured for: $printer_name"
}
show_help() {
    echo "StupidoPrint Printer Configuration Script"
    echo ""
    echo "Usage: $0 [OPTION] [ARGUMENTS]"
    echo ""
    echo "Options:"
    echo "  setup                   Interactive printer setup (default)"
    echo "  list                    List available printers"
    echo "  set <printer_name>      Set default printer"
    echo "  configure [printer]     Configure printer options"
    echo "  print <file> [printer]  Print a file"
    echo "  status                  Show current configuration"
    echo "  test [printer]          Send test page"
    echo "  help                    Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                      # Run interactive setup"
    echo "  $0 setup                # Run interactive setup"
    echo "  $0 list                 # List available printers"
    echo "  $0 set HP_LaserJet_Pro  # Set specific printer as default"
    echo "  $0 print document.pdf   # Print a file"
    echo "  $0 test                 # Send test page"
    echo ""
    echo "Note: Run '$0 setup' first to configure your printer before using the app."
}

# Main script logic
main() {
    # Load existing configuration if available
    load_config >/dev/null 2>&1
    
    case "${1:-setup}" in
        "setup"|"configure")
            interactive_setup
            ;;
        "list")
            check_cups
            list_printers
            ;;
        "set")
            check_cups
            set_default_printer "$2"
            ;;
        "print")
            print_file "$2" "$3" "$4" "$5"
            ;;
        "status")
            show_status
            ;;
        "test")
            test_print "$2"
            ;;
        "help")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
