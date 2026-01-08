use std::io;

use color_eyre::Result;
use crossterm::{
    event::{self, Event, KeyCode, KeyEventKind},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::{
    prelude::*,
    widgets::{Block, Borders, Paragraph},
};

fn main() -> Result<()> {
    color_eyre::install()?;

    // Setup terminal
    enable_raw_mode()?;
    io::stdout().execute(EnterAlternateScreen)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(io::stdout()))?;

    // Run app
    let result = run(&mut terminal);

    // Restore terminal
    disable_raw_mode()?;
    io::stdout().execute(LeaveAlternateScreen)?;

    result
}

fn run(terminal: &mut Terminal<CrosstermBackend<io::Stdout>>) -> Result<()> {
    let mut counter = 0;

    loop {
        terminal.draw(|frame| {
            let area = frame.area();

            let block = Block::default()
                .title(" mycli - Ratatui TUI ")
                .borders(Borders::ALL)
                .border_style(Style::default().fg(Color::Cyan));

            let text = vec![
                Line::from(""),
                Line::from(vec![
                    Span::raw("Counter: "),
                    Span::styled(
                        counter.to_string(),
                        Style::default().fg(Color::Yellow).bold(),
                    ),
                ]),
                Line::from(""),
                Line::from(Span::styled(
                    "Press ↑/↓ to change, q to quit",
                    Style::default().fg(Color::DarkGray),
                )),
            ];

            let paragraph = Paragraph::new(text)
                .block(block)
                .alignment(Alignment::Center);

            frame.render_widget(paragraph, area);
        })?;

        if event::poll(std::time::Duration::from_millis(100))? {
            if let Event::Key(key) = event::read()? {
                if key.kind == KeyEventKind::Press {
                    match key.code {
                        KeyCode::Char('q') | KeyCode::Esc => break,
                        KeyCode::Up | KeyCode::Char('k') => counter += 1,
                        KeyCode::Down | KeyCode::Char('j') => counter -= 1,
                        _ => {}
                    }
                }
            }
        }
    }

    Ok(())
}
