import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

const Broken = ({ broken }) => {
  if (broken) throw new Error('壊れました');
  return <p>正常な画面</p>;
};

describe('ErrorBoundary', () => {
  let consoleError;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
    jest.useRealTimers();
  });

  test('例外が起きたら案内を出し、外側の画面は残す', () => {
    render(
      <div>
        <p>メニュー</p>
        <ErrorBoundary><Broken broken /></ErrorBoundary>
      </div>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('この画面を表示できませんでした');
    expect(screen.getByRole('alert')).toHaveTextContent('壊れました');
    expect(screen.getByText('メニュー')).toBeInTheDocument();
  });

  test('resetKey が変わると（ページ移動）描き直す', () => {
    const { rerender } = render(<ErrorBoundary resetKey="/a"><Broken broken /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<ErrorBoundary resetKey="/b"><Broken broken={false} /></ErrorBoundary>);
    expect(screen.getByText('正常な画面')).toBeInTheDocument();
  });

  test('「もう一度試す」で描き直す', () => {
    const { rerender } = render(<ErrorBoundary><Broken broken /></ErrorBoundary>);
    rerender(<ErrorBoundary><Broken broken={false} /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByText('もう一度試す'));
    expect(screen.getByText('正常な画面')).toBeInTheDocument();
  });

  test('autoReloadSeconds を渡すと、その秒数後に再読み込みする', () => {
    jest.useFakeTimers();
    const reload = jest.fn();
    const original = window.location;
    delete window.location;
    window.location = { ...original, reload };
    try {
      render(<ErrorBoundary autoReloadSeconds={30}><Broken broken /></ErrorBoundary>);
      expect(screen.getByRole('alert')).toHaveTextContent('30秒後に自動で読み込み直します');
      act(() => { jest.advanceTimersByTime(29000); });
      expect(reload).not.toHaveBeenCalled();
      act(() => { jest.advanceTimersByTime(1000); });
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      window.location = original;
    }
  });
});
