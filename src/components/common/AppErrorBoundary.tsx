import { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  public static getDerivedStateFromError(): State { return { hasError: true }; }
  public componentDidCatch() { /* La interfaz no muestra detalles internos al usuario. */ }
  public render() { if (!this.state.hasError) return this.props.children; return <main className="app-error"><h1>Ocurrió un problema al cargar esta sección.</h1><p>Puedes intentar de nuevo sin perder datos del servidor.</p><button type="button" onClick={() => this.setState({ hasError: false })}>Reintentar</button></main>; }
}
