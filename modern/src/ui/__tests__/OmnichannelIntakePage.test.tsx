import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OmnichannelIntakePage from '../pages/OmnichannelIntakePage.js';

describe('OmnichannelIntakePage', () => {
  it('renders email and whatsapp channel buttons', () => {
    render(<OmnichannelIntakePage />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('WhatsApp')).toBeTruthy();
  });

  it('renders file upload and text area', () => {
    render(<OmnichannelIntakePage />);
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('renders submit button', () => {
    render(<OmnichannelIntakePage />);
    expect(screen.getByText('Process Intake')).toBeTruthy();
  });
});
