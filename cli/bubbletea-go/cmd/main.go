package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("14")).
			Border(lipgloss.RoundedBorder()).
			Padding(0, 1)

	counterStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("11")).
			Bold(true)

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("8"))
)

type model struct {
	counter int
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc", "ctrl+c":
			return m, tea.Quit
		case "up", "k":
			m.counter++
		case "down", "j":
			m.counter--
		}
	}
	return m, nil
}

func (m model) View() string {
	title := titleStyle.Render(" mycli - Bubbletea TUI ")

	counter := fmt.Sprintf("Counter: %s", counterStyle.Render(fmt.Sprintf("%d", m.counter)))

	help := helpStyle.Render("Press ↑/↓ to change, q to quit")

	return fmt.Sprintf("\n%s\n\n  %s\n\n  %s\n", title, counter, help)
}

func main() {
	p := tea.NewProgram(model{counter: 0}, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
