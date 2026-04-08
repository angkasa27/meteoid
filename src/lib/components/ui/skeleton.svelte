<script lang="ts">
	interface Props {
		class?: string;
		width?: string;
		height?: string;
		rounded?: string;
	}

	let {
		class: cls = '',
		width = 'w-full',
		height = 'h-4',
		rounded = 'rounded-lg'
	}: Props = $props();
</script>

<div class="skeleton {width} {height} {rounded} {cls}"></div>
