import type { PaperOrder } from '../../types/trading';
import {
    Container,
    Header,
    HeaderTitle,
    OrderCount,
    Body,
    Table,
    TableHead,
    TableBody,
    TableRow,
    SideCell,
    SideBadge,
    TypeBadge,
    Symbol,
    NumericCell,
    StatusCell,
    StatusBadge,
    FilledBar,
    FilledBarInner,
    CancelButton,
    EmptyState,
} from './CurrentOrders.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * CurrentOrders.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ─── Status Display Mapping ─── */
const STATUS_TEXT: Record<string, string> = {
    pending: 'Pending',
    submitted: 'Submitted',
    open: 'Open',
    partial: 'Partial',
    filled: 'Filled',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
};

/* ═══════════════════════════════════════════════════════════
 * ORDER ROW (Sub-component)
 * ═══════════════════════════════════════════════════════════
 */
interface OrderRowProps {
    order: PaperOrder;
    onCancel: (clientOrderId: string) => void;
}

function OrderRow({ order, onCancel }: OrderRowProps) {
    const canCancel = ['pending', 'open', 'partial'].includes(order.status);
    const isBuy = order.side === 'buy';

    const filledPercent = parseFloat(order.quantity) > 0
        ? (parseFloat(order.filledQty) / parseFloat(order.quantity)) * 100
        : 0;

    const handleCancel = () => {
        onCancel(order.clientOrderId);
    };

    return (
        <TableRow $status={order.status}>
            <td>
                <SideCell>
                    <SideBadge $isBuy={isBuy}>{isBuy ? 'B' : 'S'}</SideBadge>
                    <TypeBadge>{order.type === 'limit' ? 'LMT' : 'MKT'}</TypeBadge>
                </SideCell>
            </td>
            <td>
                <Symbol>{order.symbol.replace('USDT', '')}</Symbol>
            </td>
            <NumericCell>
                {order.price ? parseFloat(order.price).toFixed(2) : '—'}
            </NumericCell>
            <NumericCell>
                {parseFloat(order.quantity).toFixed(6)}
            </NumericCell>
            <StatusCell>
                <StatusBadge $status={order.status}>
                    {STATUS_TEXT[order.status] || order.status}
                </StatusBadge>
                {order.status === 'partial' && (
                    <FilledBar>
                        <FilledBarInner $percent={filledPercent} $isBuy={isBuy} />
                    </FilledBar>
                )}
            </StatusCell>
            <td style={{ textAlign: 'right' }}>
                {canCancel && (
                    <CancelButton onClick={handleCancel}>Cancel</CancelButton>
                )}
            </td>
        </TableRow>
    );
}

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface CurrentOrdersViewProps {
    /** List of open orders */
    orders: PaperOrder[];
    /** Whether there are any orders */
    hasOrders: boolean;
    /** Translations */
    translations: {
        title: string;
        noOrders: string;
    };
    /** Cancel order callback */
    onCancel: (clientOrderId: string) => void;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const CurrentOrdersView = ({
    orders,
    hasOrders,
    translations: t,
    onCancel,
}: CurrentOrdersViewProps) => {
    return (
        <Container>
            <Header>
                <HeaderTitle>
                    {t.title}
                    <OrderCount>({orders.length})</OrderCount>
                </HeaderTitle>
            </Header>

            <Body>
                {!hasOrders ? (
                    <EmptyState>{t.noOrders}</EmptyState>
                ) : (
                    <Table>
                        <TableHead>
                            <tr>
                                <th>Side</th>
                                <th>Symbol</th>
                                <th>Price</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <OrderRow
                                    key={order.clientOrderId}
                                    order={order}
                                    onCancel={onCancel}
                                />
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Body>
        </Container>
    );
}

export { CurrentOrdersView };
